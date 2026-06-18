"""
Agent orchestration loop: OpenAI function calling with Docker execution and retry logic.
"""

import json
import logging
import time

from openai import OpenAI

from agent.context import build_session_context
from agent.prompts import (
    SYSTEM_PROMPT,
    RETRY_PROMPT,
    format_column_schema,
    format_history,
)
from agent.tools import TOOLS
from config import get_settings
from services.sandbox_executor import SandboxExecutor
from services.storage import download_data_file, get_cached_path

logger = logging.getLogger("data-agent.loop")


async def run_analysis(
    session_id: str,
    question: str,
    user_id: str,
    data_source: dict,
    sandbox_executor: SandboxExecutor,
) -> dict:
    """
    Full agent analysis loop:
    1. Build context
    2. Call OpenAI with function definition
    3. Execute code in Docker sandbox
    4. Retry on failure (max 3)
    5. Get findings narrative from OpenAI

    Returns dict with: narrative, chart_json, chart_type, status, attempts, code, stdout, stderr
    """
    settings = get_settings()

    # 1. Build context
    context = await build_session_context(session_id, user_id)

    # Ensure data file is available locally
    file_format = context["data_source"]["file_format"] or "csv"
    data_file_path = get_cached_path(data_source.get("id", ""), file_format)

    if not data_file_path and data_source.get("storage_path"):
        data_file_path = await download_data_file(
            data_source["storage_path"],
            data_source["id"],
            file_format,
        )

    if not data_file_path:
        return {
            "narrative": "I could not locate the data file. Please try re-uploading your dataset.",
            "chart_json": None,
            "chart_type": "none",
            "status": "failed",
            "attempts": 0,
            "code": "",
            "stdout": "",
            "stderr": "Data file not found",
        }

    # 2. Build system prompt
    column_schema = context["data_source"]["column_schema"]
    data_profile = context["data_source"]["data_profile"]
    anomalies = data_profile.get("detected_anomalies", [])

    system_prompt = SYSTEM_PROMPT.format(
        column_schema_formatted=format_column_schema(column_schema),
        row_count=context["data_source"]["row_count"],
        column_count=data_profile.get("column_count", len(column_schema)),
        anomalies=", ".join(anomalies) if anomalies else "None detected",
        history_count=len(context["history"]),
        history_formatted=format_history(context["history"]),
        file_format=file_format,
        column_names_list=", ".join(context["data_source"]["column_names"]),
    )

    # 3. Initialize OpenAI client
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    # 4. Initial call to OpenAI
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=4096,
        )
    except Exception as e:
        logger.exception("OpenAI API call failed: %s", e)
        return _error_result(f"AI service error: {str(e)}")

    # 5. Retry loop
    attempt = 1
    max_retries = settings.MAX_RETRY_ATTEMPTS
    last_code = ""
    last_result = None
    chart_type = "none"

    while attempt <= max_retries:
        choice = response.choices[0]

        # Check if model wants to call a function
        if choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
            # Model answered without running code
            narrative = choice.message.content or "I was unable to determine the best approach for this question."
            return {
                "narrative": narrative,
                "chart_json": None,
                "chart_type": "none",
                "status": "success",
                "attempts": attempt,
                "code": "",
                "stdout": "",
                "stderr": "",
            }

        # Extract function call
        tool_call = choice.message.tool_calls[0]
        func_args = json.loads(tool_call.function.arguments)
        code = func_args.get("code", "")
        chart_type = func_args.get("chart_type", "none")
        last_code = code

        logger.info(
            "Attempt %d: executing code (chart_type=%s, reasoning=%s)",
            attempt,
            chart_type,
            func_args.get("reasoning", "")[:100],
        )

        # 6. Execute in sandbox
        last_result = await sandbox_executor.execute(
            code=code,
            data_file_path=data_file_path,
            file_format=file_format,
        )

        if last_result.status == "success":
            break

        # Don't retry on timeout
        if last_result.status == "timeout":
            return {
                "narrative": "The analysis timed out. Try a more specific question or filter to a smaller date range first.",
                "chart_json": None,
                "chart_type": "none",
                "status": "timeout",
                "attempts": attempt,
                "code": code,
                "stdout": last_result.stdout,
                "stderr": last_result.stderr,
                "execution_ms": last_result.execution_ms,
            }

        # 7. Retry: send error back to OpenAI
        attempt += 1
        if attempt <= max_retries:
            retry_prompt = RETRY_PROMPT.format(
                code=code,
                stderr=last_result.stderr,
                column_names=", ".join(context["data_source"]["column_names"]),
                detected_date_format="auto-detect",
            )

            messages.append(choice.message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": f"Execution failed:\n{last_result.stderr}",
            })
            messages.append({"role": "user", "content": retry_prompt})

            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    max_tokens=4096,
                )
            except Exception as e:
                logger.exception("OpenAI retry call failed: %s", e)
                return _error_result(f"AI service error during retry: {str(e)}")

    # 8. After loop: get narrative from OpenAI
    if last_result and last_result.status == "success":
        # Send execution result back for narrative generation
        messages.append(choice.message)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": f"Execution successful.\nSTDOUT:\n{last_result.stdout}",
        })

        try:
            final_response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=2048,
            )
            narrative = final_response.choices[0].message.content or "Analysis complete."
        except Exception as e:
            logger.exception("OpenAI narrative call failed: %s", e)
            narrative = f"Analysis completed but I could not generate a summary. Raw output:\n{last_result.stdout}"

        # Extract chart title and caption from narrative or chart JSON
        chart_title = "Analysis Result"
        chart_caption = ""
        if last_result.chart_json:
            chart_data = last_result.chart_json
            if isinstance(chart_data, list):
                # Plotly sometimes returns list of traces; wrap in layout dict
                chart_data = {"data": chart_data}
            if isinstance(chart_data, dict):
                layout = chart_data.get("layout", {})
                chart_title = layout.get("title", {})
                if isinstance(chart_title, dict):
                    chart_title = chart_title.get("text", "Analysis Result")

        return {
            "narrative": narrative,
            "chart_json": last_result.chart_json,
            "chart_type": chart_type,
            "chart_title": chart_title,
            "chart_caption": narrative[:200] if narrative else "",
            "status": "success",
            "attempts": attempt,
            "code": last_code,
            "stdout": last_result.stdout,
            "stderr": last_result.stderr,
            "execution_ms": last_result.execution_ms,
        }
    else:
        stderr = last_result.stderr if last_result else "Unknown error"
        return {
            "narrative": f"I was unable to complete this analysis after {attempt - 1} attempts. Last error: {stderr}",
            "chart_json": None,
            "chart_type": "none",
            "status": "failed",
            "attempts": attempt - 1,
            "code": last_code,
            "stdout": last_result.stdout if last_result else "",
            "stderr": stderr,
            "execution_ms": last_result.execution_ms if last_result else 0,
        }


def _error_result(message: str) -> dict:
    """Create a standardized error result."""
    return {
        "narrative": message,
        "chart_json": None,
        "chart_type": "none",
        "status": "failed",
        "attempts": 0,
        "code": "",
        "stdout": "",
        "stderr": message,
    }
