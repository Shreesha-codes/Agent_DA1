"""
PostgreSQL connector: connection testing, password encryption, data snapshot fetching.
"""

import logging

import pandas as pd
import psycopg2
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import os

from config import get_settings

logger = logging.getLogger("data-agent.sql_connector")


def encrypt_password(password: str) -> str:
    """Encrypt a PostgreSQL password using AES-256-CBC."""
    settings = get_settings()
    key = bytes.fromhex(settings.POSTGRES_ENCRYPTION_KEY)

    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    # PKCS7 padding
    pad_length = 16 - (len(password.encode()) % 16)
    padded = password.encode() + bytes([pad_length] * pad_length)

    encrypted = encryptor.update(padded) + encryptor.finalize()
    # Store as base64(iv + ciphertext)
    return base64.b64encode(iv + encrypted).decode()


def decrypt_password(encrypted: str) -> str:
    """Decrypt a PostgreSQL password."""
    settings = get_settings()
    key = bytes.fromhex(settings.POSTGRES_ENCRYPTION_KEY)

    raw = base64.b64decode(encrypted)
    iv = raw[:16]
    ciphertext = raw[16:]

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    padded = decryptor.update(ciphertext) + decryptor.finalize()
    # Remove PKCS7 padding
    pad_length = padded[-1]
    return padded[:-pad_length].decode()


async def test_pg_connection(params) -> dict:
    """
    Test a PostgreSQL connection by running SELECT 1.
    Returns success/failure with details.
    """
    try:
        conn = psycopg2.connect(
            host=params.pg_host,
            port=params.pg_port,
            dbname=params.pg_database,
            user=params.pg_username,
            password=params.pg_password,
            connect_timeout=10,
        )
        cursor = conn.cursor()

        # Test basic connectivity
        cursor.execute("SELECT 1")

        # Get row count and column count for the target table
        schema = params.pg_schema or "public"
        table = params.pg_table

        cursor.execute(
            f"SELECT COUNT(*) FROM {schema}.{table}"
        )
        row_count = cursor.fetchone()[0]

        cursor.execute(
            f"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = %s AND table_name = %s",
            (schema, table),
        )
        column_count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Connection successful",
            "row_count": row_count,
            "column_count": column_count,
        }

    except psycopg2.OperationalError as e:
        error_msg = str(e).strip()
        if "Connection refused" in error_msg:
            msg = "Could not reach the database server. Check the host and port."
        elif "authentication failed" in error_msg:
            msg = "Username or password is incorrect."
        elif "does not exist" in error_msg:
            msg = f"Database '{params.pg_database}' was not found on this server."
        else:
            msg = f"Connection failed: {error_msg}"

        return {"success": False, "message": msg}

    except psycopg2.ProgrammingError as e:
        error_msg = str(e).strip()
        if "does not exist" in error_msg:
            msg = f"Table '{params.pg_table}' was not found in schema '{params.pg_schema}'."
        elif "permission denied" in error_msg.lower():
            msg = "The user does not have SELECT permission on this table."
        else:
            msg = f"Query error: {error_msg}"

        return {"success": False, "message": msg}

    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}


async def fetch_data_snapshot(data_source: dict) -> pd.DataFrame:
    """
    Fetch up to 10,000 rows from a PostgreSQL table for profiling.
    """
    password = decrypt_password(data_source["pg_password_enc"])

    conn = psycopg2.connect(
        host=data_source["pg_host"],
        port=data_source.get("pg_port", 5432),
        dbname=data_source["pg_database"],
        user=data_source["pg_username"],
        password=password,
        connect_timeout=10,
    )

    schema = data_source.get("pg_schema", "public")
    table = data_source["pg_table"]
    query = f"SELECT * FROM {schema}.{table} LIMIT 10000"

    df = pd.read_sql(query, conn)
    conn.close()

    return df
