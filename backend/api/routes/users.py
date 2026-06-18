"""
User routes: sync Clerk user to Supabase.
"""

from fastapi import APIRouter, Depends

from api.deps import get_current_user
from db.queries import sync_user
from models.schemas import SyncUserRequest, UserResponse

router = APIRouter()


@router.post("/users/sync", response_model=UserResponse)
async def sync_user_route(body: SyncUserRequest):
    """Upsert the Clerk user into the users table on first login."""
    user = await sync_user(
        clerk_user_id=body.clerk_user_id,
        email=body.email,
        display_name=body.display_name,
    )
    return user
