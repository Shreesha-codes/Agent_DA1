"""
Data source routes: create, list, get, delete, test connection.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from api.deps import get_current_user
from db import queries
from models.schemas import (
    CreateDataSourceRequest,
    DataSourceDetail,
    DataSourceListResponse,
    DataSourceSummary,
    TestConnectionRequest,
    TestConnectionResponse,
)

logger = logging.getLogger("data-agent.routes.data_sources")
router = APIRouter()


@router.post("/data-sources", status_code=201)
async def create_data_source(
    body: CreateDataSourceRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """Create a new data source (file or postgres) and trigger profiling."""
    user_id = user["id"]

    # Build data dict
    data = {
        "name": body.name,
        "source_type": body.source_type,
        "profile_status": "pending",
    }

    if body.source_type == "file":
        data.update({
            "file_format": body.file_format,
            "storage_path": body.storage_path,
            "file_size_bytes": body.file_size_bytes,
        })
    elif body.source_type == "postgres":
        # Encrypt password before storing
        from services.sql_connector import encrypt_password
        data.update({
            "pg_host": body.pg_host,
            "pg_port": body.pg_port,
            "pg_database": body.pg_database,
            "pg_username": body.pg_username,
            "pg_password_enc": encrypt_password(body.pg_password) if body.pg_password else None,
            "pg_schema": body.pg_schema,
            "pg_table": body.pg_table,
        })

    ds = await queries.create_data_source(user_id, data)

    # Trigger async profiling
    background_tasks.add_task(_run_profiling, ds["id"], user_id)

    return {
        "id": ds["id"],
        "name": ds["name"],
        "source_type": ds["source_type"],
        "profile_status": ds["profile_status"],
        "created_at": ds["created_at"],
    }


async def _run_profiling(data_source_id: str, user_id: str):
    """Background task: profile a data source."""
    try:
        logger.info("Starting profiling for data source %s", data_source_id)

        # Update status to running
        await queries.update_data_source(data_source_id, user_id, {"profile_status": "running"})

        # Get the data source
        ds = await queries.get_data_source(data_source_id, user_id)
        if not ds:
            logger.error("Data source %s not found for profiling", data_source_id)
            return

        import pandas as pd

        if ds["source_type"] == "file":
            from services.storage import download_data_file
            from services.file_parser import parse_file

            local_path = await download_data_file(ds["storage_path"], data_source_id, ds["file_format"])
            df = parse_file(local_path, ds["file_format"])

        elif ds["source_type"] == "postgres":
            from services.sql_connector import fetch_data_snapshot
            df = await fetch_data_snapshot(ds)
            if df.empty:
                raise ValueError(f"Table '{ds.get('pg_schema', 'public')}.{ds['pg_table']}' exists but has no rows")

        else:
            raise ValueError(f"Unknown source type: {ds['source_type']}")

        # Run profiling
        from services.data_profiler import profile

        profile_result = profile(df)

        # Build column schema
        column_schema = []
        for col in profile_result["columns"]:
            schema_entry = {
                "name": col["name"],
                "dtype": col["dtype"],
                "nullable": col.get("null_count", 0) > 0,
                "sample_values": df[col["name"]].dropna().head(5).astype(str).tolist(),
            }
            column_schema.append(schema_entry)

        # Update data source with profile
        await queries.update_data_source(data_source_id, user_id, {
            "column_schema": column_schema,
            "data_profile": profile_result,
            "profile_status": "complete",
            "row_count": profile_result["row_count"],
        })

        logger.info("Profiling complete for data source %s", data_source_id)

    except Exception as e:
        logger.exception("Profiling failed for data source %s: %s", data_source_id, e)
        # Store error message for debugging
        await queries.update_data_source(data_source_id, user_id, {
            "profile_status": "failed",
            "profile_error": str(e),
        })


@router.get("/data-sources", response_model=DataSourceListResponse)
async def list_data_sources(user: dict = Depends(get_current_user)):
    """List all data sources for the authenticated user."""
    sources = await queries.list_data_sources(user["id"])
    return {"data_sources": sources}


@router.get("/data-sources/{data_source_id}")
async def get_data_source(data_source_id: str, user: dict = Depends(get_current_user)):
    """Get a single data source including full profile."""
    ds = await queries.get_data_source(data_source_id, user["id"])
    if not ds:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Data source not found"}
        })
    return ds


@router.post("/data-sources/test-connection", response_model=TestConnectionResponse)
async def test_connection(body: TestConnectionRequest, user: dict = Depends(get_current_user)):
    """Test a PostgreSQL connection without saving."""
    from services.sql_connector import test_pg_connection
    result = await test_pg_connection(body)
    return result


@router.delete("/data-sources/{data_source_id}", status_code=204)
async def delete_data_source(data_source_id: str, user: dict = Depends(get_current_user)):
    """Delete a data source and all associated data."""
    deleted = await queries.delete_data_source(data_source_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail={
            "error": {"code": "NOT_FOUND", "message": "Data source not found"}
        })
