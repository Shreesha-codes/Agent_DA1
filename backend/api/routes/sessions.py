"""
Session routes: create, list, get, delete.
"""

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user
from db import queries
from models.schemas import CreateSessionRequest, SessionListResponse

router = APIRouter()


@router.post("/sessions", status_code=201)
async def create_session(body: CreateSessionRequest, user: dict = Depends(get_current_user)):
    """Create a new analysis session linked to a data source."""
    user_id = user["id"]

    # Verify data source exists and belongs to user
    ds = await queries.get_data_source(body.data_source_id, user_id)
    if not ds:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Data source not found"}
        })

    if ds.get("profile_status") != "complete":
        raise HTTPException(status_code=400, detail={
            "error": {"code": "PROFILING_INCOMPLETE", "message": "Data profiling must complete before creating a session"}
        })

    session = await queries.create_session(user_id, body.data_source_id)
    return session


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all sessions for the authenticated user."""
    sessions_raw = await queries.list_sessions(user["id"])

    sessions = []
    for s in sessions_raw:
        data_source_name = None
        if isinstance(s.get("data_sources"), dict):
            data_source_name = s["data_sources"].get("name")

        sessions.append({
            "id": s["id"],
            "title": s.get("title"),
            "data_source_name": data_source_name,
            "message_count": s.get("message_count", 0),
            "created_at": s["created_at"],
        })

    return {"sessions": sessions}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    """Get a full session with all messages, visualizations, and execution logs."""
    session = await queries.get_session_with_messages(session_id, user["id"])
    if not session:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Session not found"}
        })
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    """Delete a session and all associated data."""
    deleted = await queries.delete_session(session_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Session not found"}
        })
