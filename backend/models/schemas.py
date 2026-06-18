"""
Pydantic request/response models for all API endpoints.
"""

from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Users ────────────────────────────────────────────────────────────────────

class SyncUserRequest(BaseModel):
    clerk_user_id: str
    email: str
    display_name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    clerk_user_id: str
    email: str
    display_name: Optional[str] = None
    created_at: str


# ── Data Sources ─────────────────────────────────────────────────────────────

class CreateDataSourceRequest(BaseModel):
    name: str
    source_type: Literal["file", "postgres"]

    # File-specific
    file_format: Optional[Literal["csv", "excel", "json"]] = None
    storage_path: Optional[str] = None
    file_size_bytes: Optional[int] = None

    # Postgres-specific
    pg_host: Optional[str] = None
    pg_port: Optional[int] = 5432
    pg_database: Optional[str] = None
    pg_username: Optional[str] = None
    pg_password: Optional[str] = None
    pg_schema: Optional[str] = "public"
    pg_table: Optional[str] = None


class TestConnectionRequest(BaseModel):
    pg_host: str
    pg_port: int = 5432
    pg_database: str
    pg_username: str
    pg_password: str
    pg_schema: str = "public"
    pg_table: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None


class DataSourceSummary(BaseModel):
    id: str
    name: str
    source_type: str
    file_format: Optional[str] = None
    row_count: Optional[int] = None
    profile_status: str
    created_at: str


class DataSourceDetail(BaseModel):
    id: str
    name: str
    source_type: str
    file_format: Optional[str] = None
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    column_schema: Optional[list] = None
    data_profile: Optional[dict] = None
    profile_status: str
    created_at: str


class DataSourceListResponse(BaseModel):
    data_sources: list[DataSourceSummary]


# ── Sessions ─────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    data_source_id: str


class SessionSummary(BaseModel):
    id: str
    title: Optional[str] = None
    data_source_name: Optional[str] = None
    message_count: int = 0
    created_at: str


class SessionListResponse(BaseModel):
    sessions: list[SessionSummary]


# ── Messages ─────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)


class VisualizationResponse(BaseModel):
    id: str
    chart_type: str
    title: str
    caption: str
    plotly_json: dict


class ExecutionLogResponse(BaseModel):
    id: str
    generated_code: str
    attempt_number: int
    status: str
    execution_ms: Optional[int] = None
    stderr: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    turn_index: int
    visualization: Optional[VisualizationResponse] = None
    execution_log: Optional[ExecutionLogResponse] = None
    created_at: Optional[str] = None


class AnalysisResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
    visualization: Optional[VisualizationResponse] = None
    execution_log: Optional[ExecutionLogResponse] = None
    session_title_updated: bool = False


# ── Error ────────────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
