"""
Subprocess sandbox executor: runs Python code in a forked process with resource limits.

Safe enough for AI-generated analysis code. Not a security sandbox — do not
run untrusted or arbitrary code from external users.
"""

import json
import logging
import os
import shutil
import signal
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

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
    _counter = 0
    _workspace = "/workspace"

    def __init__(self):
        self.settings = get_settings()
        os.makedirs(self._workspace, exist_ok=True)

    async def execute(self, code: str, data_file_path: str, file_format: str) -> ExecutionResult:
        ext = {"csv": "csv", "excel": "xlsx", "json": "json"}.get(file_format, "csv")
        start_time = time.time()

        try:
            SandboxExecutor._counter += 1
            script_path = os.path.join(self._workspace, f"script_{SandboxExecutor._counter}.py")
            data_dest = os.path.join(self._workspace, f"data.{ext}")
            chart_path = os.path.join(self._workspace, "output_chart.json")

            # Clean up any previous files
            for f in [script_path, data_dest, chart_path]:
                if os.path.exists(f):
                    try:
                        os.remove(f)
                    except Exception:
                        pass

            shutil.copy2(data_file_path, data_dest)
            with open(script_path, "w") as f:
                f.write(code)

            timeout_seconds = self.settings.SANDBOX_EXECUTION_TIMEOUT_SECONDS

            # Use python3 on Linux systems where python may not be aliased
            python_cmd = "python3" if shutil.which("python3") else "python"
            proc = subprocess.run(
                [python_cmd, script_path],
                cwd=self._workspace,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                env={"PYTHONIOENCODING": "utf-8", "PATH": os.environ.get("PATH", "")},
            )

            execution_ms = int((time.time() - start_time) * 1000)
            stdout = proc.stdout or ""
            stderr = proc.stderr or ""
            exit_code = proc.returncode

            chart_json = None
            if os.path.exists(chart_path):
                try:
                    with open(chart_path, "r") as f:
                        chart_json = json.load(f)
                except (json.JSONDecodeError, OSError) as e:
                    logger.warning("Failed to parse chart JSON: %s", e)

            status = "success" if exit_code == 0 else "failed"

            return ExecutionResult(
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
                chart_json=chart_json,
                execution_ms=execution_ms,
                status=status,
            )

        except subprocess.TimeoutExpired:
            execution_ms = int((time.time() - start_time) * 1000)
            return ExecutionResult(
                exit_code=124, stdout="", stderr="Execution timed out.",
                chart_json=None, execution_ms=execution_ms, status="timeout",
            )

        except Exception as e:
            execution_ms = int((time.time() - start_time) * 1000)
            return ExecutionResult(
                exit_code=1, stdout="", stderr=f"Sandbox error: {str(e)}",
                chart_json=None, execution_ms=execution_ms, status="failed",
            )
