import os
import sys
import uuid
import pytest
import httpx
from io import BytesIO
from PIL import Image

# Add api to path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Add worker to path to import ml_worker
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'worker')))

from main import app
from auth import get_current_user
from database import SessionLocal, Base, engine
from db_models import User, Photo, PhotoStatus, Closet
from ml_worker import Worker

# Dependency override
def override_get_current_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(clerk_user_id="test_clerk_id", email="test@example.com")
        db.add(user)
        db.flush()
        
        closet = Closet(user_id=user.id)
        db.add(closet)
        db.commit()
        db.refresh(user)
    db.close()
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Setup test database tables."""
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
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
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
            upload_resp = await s3_client.put(upload_url, content=img_bytes, headers={"Content-Type": "image/heic"})
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
    db.close()
