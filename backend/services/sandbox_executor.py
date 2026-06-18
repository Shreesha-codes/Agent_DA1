"""
E2B Cloud Sandbox executor: runs Python code in an isolated cloud sandbox.

Replaces Docker sandbox for deployment on PaaS (Render, Vercel, etc.).
Requires E2B_API_KEY environment variable (free tier available).
"""

import json
import logging
import time
from dataclasses import dataclass
from typing import Literal

from e2b_code_interpreter import Sandbox as E2BSandbox

from config import get_settings

logger = logging.getLogger("data-agent.sandbox_executor")


@dataclass
class ExecutionResult:
    exit_code: int
    stdout: str
    stderr: str
    chart_json: dict | None
    execution_ms: int
    status: Literal["success", "failed", "timeout"]


class SandboxExecutor:
    """Execute Python code using E2B Cloud Sandbox."""

    def __init__(self):
        self.settings = get_settings()

    async def execute(self, code: str, data_file_path: str, file_format: str) -> ExecutionResult:
        ext = {"csv": "csv", "excel": "xlsx", "json": "json"}.get(file_format, "csv")
        start_time = time.time()

        sandbox = None
        try:
            sandbox = E2BSandbox.create()

            with open(data_file_path, "rb") as f:
                sandbox.files.write(f"/workspace/data.{ext}", f.read())

            execution = sandbox.run_code(
                code,
                timeout=self.settings.SANDBOX_EXECUTION_TIMEOUT_SECONDS,
            )

            execution_ms = int((time.time() - start_time) * 1000)

            stdout = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
            stderr = "\n".join(execution.logs.stderr) if execution.logs.stderr else ""
            if execution.error:
                error_text = str(execution.error)
                stderr = (stderr + "\n" + error_text).strip()

            chart_json = None
            result = sandbox.commands.run("cat /workspace/output_chart.json")
            if result.exit_code == 0 and result.stdout:
                try:
                    chart_json = json.loads(result.stdout)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse chart JSON from sandbox")

            exit_code = 1 if execution.error else 0
            status = "success" if exit_code == 0 else "failed"

            return ExecutionResult(
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
                chart_json=chart_json,
                execution_ms=execution_ms,
                status=status,
            )

        except Exception as e:
            execution_ms = int((time.time() - start_time) * 1000)
            error_str = str(e).lower()

            if "timeout" in error_str:
                return ExecutionResult(
                    exit_code=124, stdout="", stderr="Execution timed out.",
                    chart_json=None, execution_ms=execution_ms, status="timeout",
                )
            if "api key" in error_str or "unauthorized" in error_str:
                return ExecutionResult(
                    exit_code=1, stdout="", stderr="Sandbox API key is invalid or missing. Set E2B_API_KEY.",
                    chart_json=None, execution_ms=execution_ms, status="failed",
                )

            return ExecutionResult(
                exit_code=1, stdout="", stderr=f"Sandbox error: {str(e)}",
                chart_json=None, execution_ms=execution_ms, status="failed",
            )

        finally:
            if sandbox:
                try:
                    sandbox.kill()
                except Exception:
                    pass
