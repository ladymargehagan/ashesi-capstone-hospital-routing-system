"""
Audit logging helper.

Call log_action() at key checkpoints to record user activity into AUDIT_LOGS.
Failures are silenced so a logging bug never breaks the main request path.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from core.db import db_cursor


def log_action(
    user_id: int,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    """
    Insert a row into AUDIT_LOGS.

    Parameters
    ----------
    user_id:      The user performing the action.
    action:       Short verb describing what happened, e.g. 'login',
                  'referral_created', 'resource_updated'.
    entity_type:  The table/domain the action targets, e.g. 'referral', 'user'.
    entity_id:    Primary key of the affected row, if applicable.
    details:      Any extra JSONB context (old/new values, reason, etc.).
    """
    try:
        with db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    json.dumps(details) if details else None,
                ),
            )
    except Exception as exc:  # never crash the caller
        print(f"[AUDIT] Failed to log action '{action}' for user {user_id}: {exc}")
