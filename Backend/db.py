"""
Database connection pool for PostgreSQL (HRSdb).

Reads DATABASE_URL from environment. Defaults to local dev PostgreSQL.
Usage:
    from db import get_conn, release_conn
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            print(cur.fetchone())
    finally:
        release_conn(conn)
"""

from __future__ import annotations

import os
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool, extras

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/HRSdb",
)

# Lazy-initialised connection pool (min 1, max 10)
_pool: pool.SimpleConnectionPool | None = None


def _get_pool() -> pool.SimpleConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    return _pool


def get_conn():
    """Get a connection from the pool."""
    return _get_pool().getconn()


def release_conn(conn):
    """Return a connection to the pool."""
    _get_pool().putconn(conn)


@contextmanager
def db_cursor(dict_cursor: bool = True):
    """
    Context manager that yields a cursor and auto-commits / releases.
    Usage:
        with db_cursor() as cur:
            cur.execute("SELECT * FROM users")
            rows = cur.fetchall()
    """
    conn = get_conn()
    try:
        cursor_factory = extras.RealDictCursor if dict_cursor else None
        with conn.cursor(cursor_factory=cursor_factory) as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)
