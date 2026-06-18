"""
Supabase Storage operations: download data files with local caching.
"""

import logging
import os
from pathlib import Path

from config import get_settings
from db.client import get_supabase

logger = logging.getLogger("data-agent.storage")

BUCKET_NAME = "data-uploads"


async def download_data_file(storage_path: str, data_source_id: str, file_format: str) -> str:
    """
    Download a data file from Supabase Storage to local cache.

    Cache key: data_source_id
    Cache path: {DATA_CACHE_DIR}/{data_source_id}.{ext}

    Returns: local file path
    """
    settings = get_settings()
    ext = _format_to_ext(file_format)
    cache_path = os.path.join(settings.DATA_CACHE_DIR, f"{data_source_id}.{ext}")

    # Check if cached
    if os.path.exists(cache_path):
        logger.info("Using cached data file: %s", cache_path)
        return cache_path

    # Download from Supabase Storage
    logger.info("Downloading data file from Supabase Storage: %s", storage_path)
    os.makedirs(settings.DATA_CACHE_DIR, exist_ok=True)

    sb = get_supabase()
    response = sb.storage.from_(BUCKET_NAME).download(storage_path)

    with open(cache_path, "wb") as f:
        f.write(response)

    logger.info("Data file cached at: %s", cache_path)
    return cache_path


async def invalidate_cache(data_source_id: str, file_format: str):
    """Remove the cached data file for a data source."""
    settings = get_settings()
    ext = _format_to_ext(file_format)
    cache_path = os.path.join(settings.DATA_CACHE_DIR, f"{data_source_id}.{ext}")

    if os.path.exists(cache_path):
        os.remove(cache_path)
        logger.info("Cache invalidated: %s", cache_path)


def get_cached_path(data_source_id: str, file_format: str) -> str | None:
    """Get the cached file path if it exists, else None."""
    settings = get_settings()
    ext = _format_to_ext(file_format)
    cache_path = os.path.join(settings.DATA_CACHE_DIR, f"{data_source_id}.{ext}")
    return cache_path if os.path.exists(cache_path) else None


def _format_to_ext(file_format: str) -> str:
    """Map file format to file extension."""
    return {
        "csv": "csv",
        "excel": "xlsx",
        "json": "json",
    }.get(file_format, "csv")
