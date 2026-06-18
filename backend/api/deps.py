"""
Shared FastAPI dependencies: authentication, database access.
"""

import asyncio
import logging
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, Header, HTTPException

from config import get_settings, Settings
from db.client import get_supabase

logger = logging.getLogger("data-agent.deps")

# ── Cache for Clerk JWKS ─────────────────────────────────────────────────────
_jwks_cache: dict | None = None
_jwks_cache_time: float = 0
_jwks_lock = asyncio.Lock()


async def _fetch_clerk_jwks(jwks_url: str) -> dict:
    """Fetch Clerk's JSON Web Key Set (cached for 1 hour, thread-safe)."""
    import time
    global _jwks_cache, _jwks_cache_time

    async with _jwks_lock:
        now = time.time()
        if _jwks_cache and (now - _jwks_cache_time) < 3600:
            return _jwks_cache

        async with httpx.AsyncClient() as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_cache_time = now
            return _jwks_cache


async def verify_clerk_jwt(token: str, settings: Settings) -> str:
    """
    Validate a Clerk JWT and return the clerk_user_id (sub claim).
    """
    try:
        jwks = await _fetch_clerk_jwks(settings.CLERK_JWKS_URL)
        # Get the signing key
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        matching_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                matching_key = key
                break

        if not matching_key:
            raise HTTPException(status_code=401, detail={
                "error": {"code": "UNAUTHORIZED", "message": "Invalid token signing key"}
            })

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(matching_key)
        payload = jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't always set audience
        )
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(status_code=401, detail={
                "error": {"code": "UNAUTHORIZED", "message": "Token missing subject claim"}
            })
        return clerk_user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "Token has expired"}
        })
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": f"Invalid token: {str(e)}"}
        })


async def get_current_user(
    authorization: Annotated[str, Header()],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """
    FastAPI dependency: validates Clerk JWT and returns user dict.
    Auto-creates user in Supabase if first login.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "Authorization header must start with Bearer"}
        })

    token = authorization.replace("Bearer ", "")
    clerk_user_id = await verify_clerk_jwt(token, settings)

    # Get or create user in Supabase
    from db.queries import get_or_create_user
    user = await get_or_create_user(clerk_user_id)
    return user


def get_db():
    """FastAPI dependency: returns Supabase client."""
    return get_supabase()
