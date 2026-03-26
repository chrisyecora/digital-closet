import os
import sys
import uuid
import pytest
import httpx
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env')))

# Add api to path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Add worker to path to import ml_worker
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'worker')))

from main import app
from auth import get_current_user
from database import SessionLocal, Base, engine
from db_models import User, Photo, PhotoStatus, Closet, ItemMatch
from ml_worker import Worker

# Dependency override
def override_get_current_user():
    db = SessionLocal()
    # Use environment variables if provided, otherwise default to dummy
    # Ensure isolation per test run by using a unique clerk id
    if not hasattr(override_get_current_user, "clerk_id"):
        override_get_current_user.clerk_id = f"test_clerk_{uuid.uuid4()}"
        
    clerk_id = override_get_current_user.clerk_id
    email = f"{clerk_id}@example.com"
    
    user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
    if not user:
        user = User(clerk_user_id=clerk_id, email=email)
        db.add(user)
        db.flush()
        
        closet = Closet(user_id=user.id)
        db.add(closet)
        db.commit()
        db.refresh(user)
    db.close()
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

from sqlalchemy import text

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Setup test database tables."""
    # Ensure pgvector extension exists
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    yield
    # Optionally drop tables or clean up
    # Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_full_upload_and_process_pipeline():
    """
    E2E Test:
    1. Hit POST /photos to get a presigned URL.
    2. Upload a dummy image to the MinIO presigned URL.
    3. Hit POST /photos/{id}/confirm to enqueue the processing job.
    4. Run the ML Worker once to consume the job.
    5. Verify the database state.
    """
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create photo record
        response = await client.post("/photos", json={"taken_at": "2024-01-01T12:00:00Z"})
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "upload_url" in data
        photo_id = data["id"]
        upload_url = data["upload_url"]

        # 2. Upload test HEIC image to MinIO
        img_path = os.path.join(os.path.dirname(__file__), "assets", "test_image.HEIC")
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        
        # httpx put to presigned url
        async with httpx.AsyncClient() as s3_client:
            upload_resp = await s3_client.put(upload_url, content=img_bytes, headers={"Content-Type": "image/jpeg"})
            assert upload_resp.status_code == 200

        # 3. Confirm upload
        confirm_resp = await client.post(f"/photos/{photo_id}/confirm")
        assert confirm_resp.status_code == 200
        confirm_data = confirm_resp.json()
        assert confirm_data["status"] == "pending_processing"

    # 4. Run the ML Worker synchronously
    print("Running ML Worker on local queue...")
    # NOTE: In local testing this requires Docker (MinIO, Postgres, ElasticMQ) to be running.
    try:
        worker = Worker()
        # Set WaitTimeSeconds to 1 so the test doesn't hang long
        worker.sqs.receive_message = lambda **kwargs: worker.sqs._make_api_call("ReceiveMessage", {**kwargs, "WaitTimeSeconds": 1})
        worker.run(once=True)
    except Exception as e:
        pytest.fail(f"Worker failed to execute: {e}")

    # 5. Verify database state
    db = SessionLocal()
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    assert photo is not None
    assert photo.status == PhotoStatus.PROCESSED
    
    # Verify exactly 3 items are identified
    matches = db.query(ItemMatch).filter(ItemMatch.photo_id == photo_id).all()
    assert len(matches) == 3, f"Expected 3 items identified, got {len(matches)}"
    
    # Check that there are no duplicate categories
    categories = [match.clothing_item.category.value for match in matches]
    assert len(set(categories)) == 3, f"Expected unique categories, got {categories}"
    
    # Save the first run's clothing item IDs
    first_run_item_ids = {match.clothing_item_id for match in matches}
    
    # RUN 2: Duplicate image upload
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create second photo record
        response2 = await client.post("/photos", json={"taken_at": "2024-01-01T12:00:00Z"})
        assert response2.status_code == 201
        data2 = response2.json()
        photo_id2 = data2["id"]
        upload_url2 = data2["upload_url"]

        # Upload test HEIC image to MinIO again
        async with httpx.AsyncClient() as s3_client:
            upload_resp2 = await s3_client.put(upload_url2, content=img_bytes, headers={"Content-Type": "image/jpeg"})
            assert upload_resp2.status_code == 200

        # Confirm second upload
        confirm_resp2 = await client.post(f"/photos/{photo_id2}/confirm")
        assert confirm_resp2.status_code == 200
        
    print("Running ML Worker on local queue for second image...")
    try:
        worker = Worker()
        # Set WaitTimeSeconds to 1 so the test doesn't hang long
        worker.sqs.receive_message = lambda **kwargs: worker.sqs._make_api_call("ReceiveMessage", {**kwargs, "WaitTimeSeconds": 1})
        worker.run(once=True)
    except Exception as e:
        pytest.fail(f"Worker failed to execute on second run: {e}")

    # Verify database state after second run
    db = SessionLocal()
    photo2 = db.query(Photo).filter(Photo.id == photo_id2).first()
    assert photo2 is not None
    assert photo2.status == PhotoStatus.PROCESSED
    
    # Total ClothingItems for this user should remain 3
    # Wait, getting user from photo
    user_id = photo.user_id
    from db_models import ClothingItem
    items_count = db.query(ClothingItem).join(Closet).filter(Closet.user_id == user_id).count()
    assert items_count == 3, f"Expected exactly 3 items, got {items_count}"
    
    # Verify 3 matches for the second photo
    matches2 = db.query(ItemMatch).filter(ItemMatch.photo_id == photo_id2).all()
    assert len(matches2) == 3, f"Expected 3 items identified for second photo, got {len(matches2)}"
    
    # Verify the clothing item IDs are exactly the same as the first run
    second_run_item_ids = {match.clothing_item_id for match in matches2}
    assert first_run_item_ids == second_run_item_ids, "Second run created new items instead of deduplicating!"
    
    db.close()

@pytest.mark.asyncio
async def test_dry_run_image_matching():
    """
    Test that uploads an image to the pipeline specifically to test the dry run
    reporting capabilities, validating it prints exactly what was identified, 
    what was matched, and what actions would have been taken (e.g., creating 
    vs incrementing worn_count).
    """
    # Create fresh UUID for the new test context
    override_get_current_user.clerk_id = f"test_clerk_{uuid.uuid4()}"
    
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # First upload (Baseline to populate some items)
        response1 = await client.post("/photos", json={"taken_at": "2024-01-01T12:00:00Z"})
        data1 = response1.json()
        photo_id1, upload_url1 = data1["id"], data1["upload_url"]

        img_path = os.path.join(os.path.dirname(__file__), "assets", "test_image.HEIC")
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        
        async with httpx.AsyncClient() as s3_client:
            await s3_client.put(upload_url1, content=img_bytes, headers={"Content-Type": "image/jpeg"})

        await client.post(f"/photos/{photo_id1}/confirm")

        worker = Worker()
        worker.sqs.receive_message = lambda **kwargs: worker.sqs._make_api_call("ReceiveMessage", {**kwargs, "WaitTimeSeconds": 1})
        # Process the first image, committing to DB
        worker.run(once=True)

        # Second upload (Dry Run)
        response2 = await client.post("/photos", json={"taken_at": "2024-01-01T12:00:00Z"})
        data2 = response2.json()
        photo_id2, upload_url2 = data2["id"], data2["upload_url"]

        img2_path = os.path.join(os.path.dirname(__file__), "assets", "test_image_2.HEIC")
        with open(img2_path, "rb") as f:
            img2_bytes = f.read()

        async with httpx.AsyncClient() as s3_client:
            await s3_client.put(upload_url2, content=img2_bytes, headers={"Content-Type": "image/jpeg"})

        await client.post(f"/photos/{photo_id2}/confirm")
        
        print("\n\n" + "="*50)
        print("EXECUTING DRY RUN PIPELINE TEST WITH DIFFERENT IMAGE")
        print("="*50)
        
        # Run worker in dry run mode and capture the reports
        reports = worker.run(once=True, dry_run=True)
        assert len(reports) > 0, "No reports generated by worker"
        report = reports[0]
        
        print("\n1. CLOTHING ITEMS IDENTIFIED:")
        for item in report["identified_items"]:
            print(f"   - Category: {item['category']} (Confidence: {item['confidence']:.2f})")
            if 'name' in item:
                print(f"     > Classified as: {item['name']} (Color: {item['color']}, Sub-category: {item['sub_category']})")
            print(f"     > Crop saved: {item.get('crop_path')}")
            
        print("\n2. SIMILAR ITEMS FOUND IN DATABASE:")
        for item in report["similar_items"]:
            print(f"   - Category: {item['category']} (Match Distance: {item['distance']:.4f}) -> ID: {item['item_id']}")
            
        print("\n3. ACTIONS THAT WOULD BE TAKEN:")
        for action in report["actions"]:
            print(f"   - {action}")
            
        print("="*50 + "\n")

        # Verify it actually rolled back
        db = SessionLocal()
        photo2 = db.query(Photo).filter(Photo.id == photo_id2).first()
        # Photo status is PROCESSED in memory, but in DB it should be PENDING_PROCESSING because it rolled back!
        assert photo2.status == PhotoStatus.PENDING_PROCESSING
        
        # Confirm no extra items were created
        from db_models import ClothingItem
        items_count = db.query(ClothingItem).join(Closet).filter(Closet.user_id == photo2.user_id).count()
        assert items_count == 3, f"Expected 3 items in DB, but got {items_count}. Rollback failed!"
        db.close()
