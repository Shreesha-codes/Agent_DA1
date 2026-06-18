"""
Session context builder: assembles data source info + conversation history
for the agent's system prompt.
"""

import logging
from db import queries

logger = logging.getLogger("data-agent.context")


async def build_session_context(session_id: str, user_id: str) -> dict:
    """
    Build the full context needed for an agent analysis turn.

    Returns:
    {
        "data_source": {
            "name": str,
            "source_type": str,
            "file_format": str | None,
            "row_count": int,
            "column_schema": list[dict],
            "data_profile": dict,
            "column_names": list[str],
        },
        "history": [
            {
                "turn_index": int,
                "question": str,
                "narrative": str,
            }
        ]  # Last 10 turns only
    }
    """
    # Get session
    session = await queries.get_session(session_id, user_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Get data source
    data_source = await queries.get_data_source(session["data_source_id"], user_id)
    if not data_source:
        raise ValueError(f"Data source for session {session_id} not found")

    # Get message history (last 20 messages = up to 10 turns)
    messages = await queries.get_message_history(session_id, user_id, limit=20)

    # Pair up user/assistant messages into turns
    history = []
    i = 0
    while i < len(messages):
        msg = messages[i]
        if msg["role"] == "user":
            turn = {
                "turn_index": msg["turn_index"],
                "question": msg["content"],
                "narrative": "",
            }
            # Look for the next assistant message
            if i + 1 < len(messages) and messages[i + 1]["role"] == "assistant":
                narrative = messages[i + 1]["content"]
                if len(narrative) > 500:
                    narrative = narrative[:500] + "..."
                turn["narrative"] = narrative
                i += 2
            else:
                i += 1
            history.append(turn)
        else:
            i += 1

    # Keep only last 10 turns
    history = history[-10:]

    # Extract column names
    column_schema = data_source.get("column_schema") or []
    column_names = [col["name"] for col in column_schema]

    return {
        "data_source": {
            "name": data_source["name"],
            "source_type": data_source["source_type"],
            "file_format": data_source.get("file_format", "csv"),
            "row_count": data_source.get("row_count", 0),
            "column_schema": column_schema,
            "data_profile": data_source.get("data_profile", {}),
            "column_names": column_names,
        },
        "history": history,
    }
