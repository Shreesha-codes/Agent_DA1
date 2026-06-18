"""
Supabase client initialization.
Uses service_role key (bypasses RLS) for backend operations.
"""

from functools import lru_cache
from supabase import create_client, Client
from config import get_settings


@lru_cache()
def get_supabase() -> Client:
    """Return a cached Supabase client using service_role key."""
    settings = get_settings()
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
