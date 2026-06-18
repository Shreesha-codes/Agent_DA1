"""
Message routes: submit questions and trigger the agent analysis loop.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user
from db import queries
from models.schemas import SendMessageRequest

logger = logging.getLogger("data-agent.routes.messages")
router = APIRouter()


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: SendMessageRequest,
    user: dict = Depends(get_current_user),
):
    """
    Submit a new question. Triggers the full agent analysis loop.
    Synchronous — waits for analysis to complete before responding.
    """
    user_id = user["id"]
    question = body.question.strip()

    if not question:
        raise HTTPException(status_code=422, detail={
            "error": {"code": "VALIDATION_ERROR", "message": "Question cannot be empty"}
        })

    # Verify session exists and belongs to user
    session = await queries.get_session(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Session not found"}
        })

    # Verify data source is profiled
    ds = await queries.get_data_source(session["data_source_id"], user_id)
    if not ds or ds.get("profile_status") != "complete":
        raise HTTPException(status_code=400, detail={
            "error": {"code": "PROFILING_INCOMPLETE", "message": "Data source profiling is not complete"}
        })

    # Get next turn index
    turn_index = await queries.get_next_turn_index(session_id)

    # Save user message
    user_msg = await queries.create_message(
        session_id=session_id,
        user_id=user_id,
        role="user",
        content=question,
        turn_index=turn_index,
    )

    # Auto-set session title from first question
    session_title_updated = False
    if turn_index == 0:
        title = question[:60] + ("..." if len(question) > 60 else "")
        await queries.update_session(session_id, user_id, {"title": title})
        session_title_updated = True

    # Run agent analysis loop
    try:
        from agent.loop import run_analysis
        from services.sandbox_executor import SandboxExecutor

        executor = SandboxExecutor()
        agent_result = await run_analysis(
            session_id=session_id,
            question=question,
            user_id=user_id,
            data_source=ds,
            docker_executor=executor,
        )
    except Exception as e:
        logger.exception("Agent analysis failed: %s", e)
        # Save error message
        assistant_msg = await queries.create_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=f"I encountered an error while analyzing your data: {str(e)}",
            turn_index=turn_index + 1,
        )
        return {
            "user_message": user_msg,
            "assistant_message": assistant_msg,
            "visualization": None,
            "execution_log": None,
            "session_title_updated": session_title_updated,
        }

    # Save visualization if present
    viz_record = None
    if agent_result.get("chart_json"):
        viz_record = await queries.save_visualization(
            session_id=session_id,
            user_id=user_id,
            chart_type=agent_result.get("chart_type", "bar"),
            title=agent_result.get("chart_title", "Analysis Result"),
            caption=agent_result.get("chart_caption", ""),
            plotly_json=agent_result["chart_json"],
        )

    # Save execution log
    exec_log = await queries.save_execution_log(
        session_id=session_id,
        user_id=user_id,
        question=question,
        attempt_number=agent_result.get("attempts", 1),
        generated_code=agent_result.get("code", ""),
        stdout=agent_result.get("stdout", ""),
        stderr=agent_result.get("stderr", ""),
        exit_code=0 if agent_result.get("status") == "success" else 1,
        execution_ms=agent_result.get("execution_ms"),
        status=agent_result.get("status", "failed"),
    )

    # Save assistant message
    assistant_msg = await queries.create_message(
        session_id=session_id,
        user_id=user_id,
        role="assistant",
        content=agent_result.get("narrative", "Analysis complete."),
        turn_index=turn_index + 1,
        execution_log_id=exec_log["id"],
        visualization_id=viz_record["id"] if viz_record else None,
    )

    # Attach nested objects for response
    assistant_msg["visualization"] = viz_record
    assistant_msg["execution_log"] = exec_log

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "visualization": viz_record,
        "execution_log": exec_log,
        "session_title_updated": session_title_updated,
    }
