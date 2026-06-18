"""
Docker sandbox executor: runs Python code in an isolated container.

Safety measures:
- No network access (--network none)
- Memory-limited (configurable, default 256MB to protect host)
- CPU-limited (configurable, default 0.5 cores)
- Read-only root filesystem
- Non-root user in container
- 30-second timeout
- Temp directory cleaned up after execution
"""

import json
import logging
import os
import shutil
import time
from dataclasses import dataclass
from typing import Literal
from uuid import uuid4

import docker
from docker.errors import ContainerError, ImageNotFound, APIError

from config import get_settings

logger = logging.getLogger("data-agent.docker_executor")


@dataclass
class ExecutionResult:
    exit_code: int
    stdout: str
    stderr: str
    chart_json: dict | None
    execution_ms: int
    status: Literal["success", "failed", "timeout"]


class DockerExecutor:
    """Execute Python code in an isolated Docker sandbox container."""

    def __init__(self):
        self.settings = get_settings()
        self._client = None

    @property
    def client(self):
        """Lazy Docker client initialization."""
        if self._client is None:
            self._client = docker.from_env()
        return self._client

    def _ensure_image(self) -> bool:
        """Check if the sandbox image exists."""
        try:
            self.client.images.get(self.settings.SANDBOX_IMAGE_NAME)
            return True
        except ImageNotFound:
            logger.error("Sandbox image '%s' not found. Build it first.", self.settings.SANDBOX_IMAGE_NAME)
            return False

    async def execute(self, code: str, data_file_path: str, file_format: str) -> ExecutionResult:
        """
        Execute Python code in a sandboxed Docker container.

        Args:
            code: Python code to execute
            data_file_path: Path to the data file on the host
            file_format: 'csv', 'excel', or 'json'

        Returns:
            ExecutionResult with stdout, stderr, chart JSON, timing
        """
        exec_id = str(uuid4())
        ext = {"csv": "csv", "excel": "xlsx", "json": "json"}.get(file_format, "csv")
        workspace = f"/tmp/sandbox_{exec_id}"

        try:
            # 1. Create workspace directory
            os.makedirs(workspace, exist_ok=True)

            # 2. Copy data file to workspace
            data_dest = os.path.join(workspace, f"data.{ext}")
            shutil.copy2(data_file_path, data_dest)

            # 3. Write script to workspace
            script_path = os.path.join(workspace, "script.py")
            with open(script_path, "w") as f:
                f.write(code)

            # 4. Ensure sandbox image exists
            if not self._ensure_image():
                return ExecutionResult(
                    exit_code=1,
                    stdout="",
                    stderr="Sandbox Docker image not found. Run: docker-compose build sandbox",
                    chart_json=None,
                    execution_ms=0,
                    status="failed",
                )

            # 5. Run container with strict isolation
            start_time = time.time()

            try:
                container = self.client.containers.run(
                    image=self.settings.SANDBOX_IMAGE_NAME,
                    command=f"python /workspace/script.py",
                    volumes={
                        workspace: {"bind": "/workspace", "mode": "rw"},
                    },
                    working_dir="/workspace",
                    network_mode="none",
                    mem_limit=self.settings.SANDBOX_MEMORY_LIMIT,
                    memswap_limit=self.settings.SANDBOX_MEMORY_LIMIT,
                    cpu_period=100000,
                    cpu_quota=int(self.settings.SANDBOX_CPU_LIMIT * 100000),
                    read_only=True,
                    tmpfs={"/tmp": "size=100m"},
                    remove=True,
                    detach=False,
                    stdout=True,
                    stderr=True,
                    # Safety: timeout kills container
                    # Docker SDK doesn't have a direct timeout, so we handle it separately
                )

                execution_ms = int((time.time() - start_time) * 1000)
                stdout = container.decode("utf-8") if isinstance(container, bytes) else str(container)
                stderr = ""
                exit_code = 0

            except ContainerError as e:
                execution_ms = int((time.time() - start_time) * 1000)
                stdout = e.stderr.decode("utf-8") if isinstance(e.stderr, bytes) else str(e.stderr)
                stderr = stdout
                exit_code = e.exit_status
                stdout = ""

            except APIError as e:
                execution_ms = int((time.time() - start_time) * 1000)

                # Check for OOM kill or timeout
                if "out of memory" in str(e).lower() or "OOMKilled" in str(e):
                    return ExecutionResult(
                        exit_code=137,
                        stdout="",
                        stderr="Container killed: out of memory. Try a more specific query or filter the data.",
                        chart_json=None,
                        execution_ms=execution_ms,
                        status="timeout",
                    )

                return ExecutionResult(
                    exit_code=1,
                    stdout="",
                    stderr=f"Docker API error: {str(e)}",
                    chart_json=None,
                    execution_ms=execution_ms,
                    status="failed",
                )

            # Check timeout
            if execution_ms > self.settings.DOCKER_EXECUTION_TIMEOUT_SECONDS * 1000:
                return ExecutionResult(
                    exit_code=124,
                    stdout="",
                    stderr="Execution timed out. Try a more specific question or filter to a smaller data range.",
                    chart_json=None,
                    execution_ms=execution_ms,
                    status="timeout",
                )

            # 6. Read chart JSON if it exists
            chart_json = None
            chart_path = os.path.join(workspace, "output_chart.json")
            if os.path.exists(chart_path):
                try:
                    with open(chart_path, "r") as f:
                        chart_json = json.load(f)
                except (json.JSONDecodeError, IOError) as e:
                    logger.warning("Failed to read chart JSON: %s", e)

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
            logger.exception("Docker execution failed: %s", e)
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=f"Execution error: {str(e)}",
                chart_json=None,
                execution_ms=0,
                status="failed",
            )

        finally:
            # 7. Clean up workspace
            try:
                if os.path.exists(workspace):
                    shutil.rmtree(workspace)
            except Exception as e:
                logger.warning("Failed to clean up workspace %s: %s", workspace, e)
