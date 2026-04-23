from fastapi import FastAPI, Depends
from auth import get_current_user
from db_models import User
from routers import photos, items

app = FastAPI()

app.include_router(photos.router)
app.include_router(items.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "clerk_user_id": current_user.clerk_user_id,
        "email": current_user.email,
        "created_at": current_user.created_at
    }
