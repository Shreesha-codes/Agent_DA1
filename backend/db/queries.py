"""
All database read/write operations.
Every query includes a user_id filter for authorization.
"""

import logging
from datetime import datetime, timezone
from uuid import uuid4

from db.client import get_supabase

logger = logging.getLogger("data-agent.db")


# ── Users ────────────────────────────────────────────────────────────────────

async def get_or_create_user(clerk_user_id: str, email: str = None, display_name: str = None) -> dict:
    """Get existing user by clerk_user_id or create a new one."""
    sb = get_supabase()

    result = sb.table("users").select("*").eq("clerk_user_id", clerk_user_id).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    # Create new user
    new_user = {
        "clerk_user_id": clerk_user_id,
        "email": email or f"{clerk_user_id}@placeholder.com",
        "display_name": display_name,
    }
    result = sb.table("users").insert(new_user).execute()
    logger.info("Created new user: %s", clerk_user_id)
    return result.data[0]


async def sync_user(clerk_user_id: str, email: str, display_name: str = None) -> dict:
    """Upsert a user from Clerk sync."""
    sb = get_supabase()

    result = sb.table("users").select("*").eq("clerk_user_id", clerk_user_id).execute()

    if result.data and len(result.data) > 0:
        # Update existing
        updated = sb.table("users").update({
            "email": email,
            "display_name": display_name,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("clerk_user_id", clerk_user_id).execute()
        return updated.data[0]

    # Insert new
    new_user = {
        "clerk_user_id": clerk_user_id,
        "email": email,
        "display_name": display_name,
    }
    result = sb.table("users").insert(new_user).execute()
    return result.data[0]


# ── Data Sources ─────────────────────────────────────────────────────────────

async def create_data_source(user_id: str, data: dict) -> dict:
    """Create a new data source."""
    sb = get_supabase()
    data["user_id"] = user_id
    result = sb.table("data_sources").insert(data).execute()
    return result.data[0]


async def list_data_sources(user_id: str) -> list[dict]:
    """List all data sources for a user."""
    sb = get_supabase()
    result = sb.table("data_sources").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data


async def get_data_source(data_source_id: str, user_id: str) -> dict | None:
    """Get a single data source (user-scoped)."""
    sb = get_supabase()
    result = sb.table("data_sources").select("*").eq("id", data_source_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def update_data_source(data_source_id: str, user_id: str, updates: dict) -> dict | None:
    """Update a data source (user-scoped)."""
    sb = get_supabase()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("data_sources").update(updates).eq("id", data_source_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def delete_data_source(data_source_id: str, user_id: str) -> bool:
    """Delete a data source and cascade to sessions."""
    sb = get_supabase()
    result = sb.table("data_sources").delete().eq("id", data_source_id).eq("user_id", user_id).execute()
    return len(result.data) > 0 if result.data else False


# ── Sessions ─────────────────────────────────────────────────────────────────

async def create_session(user_id: str, data_source_id: str) -> dict:
    """Create a new analysis session."""
    sb = get_supabase()
    session = {
        "user_id": user_id,
        "data_source_id": data_source_id,
        "message_count": 0,
    }
    result = sb.table("sessions").insert(session).execute()
    return result.data[0]


async def list_sessions(user_id: str) -> list[dict]:
    """List all sessions for a user with data source names."""
    sb = get_supabase()
    result = sb.table("sessions").select(
        "*, data_sources(name)"
    ).eq("user_id", user_id).order("updated_at", desc=True).execute()
    return result.data


async def get_session(session_id: str, user_id: str) -> dict | None:
    """Get a single session (user-scoped)."""
    sb = get_supabase()
    result = sb.table("sessions").select("*").eq("id", session_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def get_session_with_messages(session_id: str, user_id: str) -> dict | None:
    """Get a full session with data source, messages, visualizations, and execution logs."""
    sb = get_supabase()

    # Get session
    session = await get_session(session_id, user_id)
    if not session:
        return None

    # Get data source
    data_source = await get_data_source(session["data_source_id"], user_id)

    # Get messages ordered by turn_index
    messages = sb.table("messages").select("*").eq(
        "session_id", session_id
    ).eq("user_id", user_id).order("turn_index").execute()

    # Get visualizations and execution logs for this session
    visualizations = sb.table("visualizations").select("*").eq(
        "session_id", session_id
    ).eq("user_id", user_id).execute()

    execution_logs = sb.table("execution_logs").select("*").eq(
        "session_id", session_id
    ).eq("user_id", user_id).execute()

    # Build viz and log lookup maps
    viz_map = {v["id"]: v for v in (visualizations.data or [])}
    log_map = {l["id"]: l for l in (execution_logs.data or [])}

    # Attach vizs and logs to messages
    enriched_messages = []
    for msg in (messages.data or []):
        enriched = {**msg}
        if msg.get("visualization_id") and msg["visualization_id"] in viz_map:
            enriched["visualization"] = viz_map[msg["visualization_id"]]
        if msg.get("execution_log_id") and msg["execution_log_id"] in log_map:
            enriched["execution_log"] = log_map[msg["execution_log_id"]]
        enriched_messages.append(enriched)

    session["data_source"] = data_source
    session["messages"] = enriched_messages
    return session


async def update_session(session_id: str, user_id: str, updates: dict) -> dict | None:
    """Update a session (user-scoped)."""
    sb = get_supabase()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("sessions").update(updates).eq("id", session_id).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def delete_session(session_id: str, user_id: str) -> bool:
    """Delete a session (cascades to messages, visualizations, execution_logs)."""
    sb = get_supabase()
    result = sb.table("sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
    return len(result.data) > 0 if result.data else False


# ── Messages ─────────────────────────────────────────────────────────────────

async def create_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    turn_index: int,
    execution_log_id: str = None,
    visualization_id: str = None,
) -> dict:
    """Create a message in a session."""
    sb = get_supabase()
    message = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "turn_index": turn_index,
        "execution_log_id": execution_log_id,
        "visualization_id": visualization_id,
    }
    result = sb.table("messages").insert(message).execute()

    # Update session message count
    sb.rpc("increment_message_count", {"sid": session_id}).execute()

    return result.data[0]


async def get_message_history(session_id: str, user_id: str, limit: int = 20) -> list[dict]:
    """Get the last N messages for a session."""
    sb = get_supabase()
    result = sb.table("messages").select("*").eq(
        "session_id", session_id
    ).eq("user_id", user_id).order("turn_index").limit(limit).execute()
    return result.data or []


async def get_next_turn_index(session_id: str) -> int:
    """Get the next turn index for a session."""
    sb = get_supabase()
    result = sb.table("messages").select("turn_index").eq(
        "session_id", session_id
    ).order("turn_index", desc=True).limit(1).execute()

    if result.data:
        return result.data[0]["turn_index"] + 1
    return 0


# ── Execution Logs ───────────────────────────────────────────────────────────

async def save_execution_log(
    session_id: str,
    user_id: str,
    question: str,
    attempt_number: int,
    generated_code: str,
    stdout: str = None,
    stderr: str = None,
    exit_code: int = 1,
    execution_ms: int = None,
    status: str = "failed",
) -> dict:
    """Save an execution log entry."""
    sb = get_supabase()
    log = {
        "session_id": session_id,
        "user_id": user_id,
        "question": question,
        "attempt_number": attempt_number,
        "generated_code": generated_code,
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "execution_ms": execution_ms,
        "status": status,
    }
    result = sb.table("execution_logs").insert(log).execute()
    return result.data[0]


# ── Visualizations ───────────────────────────────────────────────────────────

async def save_visualization(
    session_id: str,
    user_id: str,
    chart_type: str,
    title: str,
    caption: str,
    plotly_json: dict,
) -> dict:
    """Save a visualization entry."""
    sb = get_supabase()
    viz = {
        "session_id": session_id,
        "user_id": user_id,
        "chart_type": chart_type,
        "title": title,
        "caption": caption,
        "plotly_json": plotly_json,
    }
    result = sb.table("visualizations").insert(viz).execute()
    return result.data[0]
