"""
Refresh 50% of hospital resource rows with updated available_count figures
and a fresh last_updated timestamp.

Does NOT add or remove resources — only updates existing rows.

Usage:
    cd Backend && python refresh_resources.py
"""

from __future__ import annotations

import os
import random
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from core.db import db_cursor

# How much to vary the available_count by (±fraction of total_count).
# 0.15 means the available count shifts by up to 15% of total in either direction.
VARIATION_FRACTION = 0.15

# Minimum available_count for binary resources (blood_bank, lab, theatre, etc.)
# that have total_count == 1. Keep them at 1.
BINARY_RESOURCE_TYPES = {"blood_bank", "lab", "oxygen", "xray", "ct_scan", "mri", "ultrasound"}


def jitter(available: int, total: int, resource_type: str) -> int:
    """Return a new available_count close to the current one but slightly varied."""
    if resource_type in BINARY_RESOURCE_TYPES or total <= 1:
        return available  # don't touch binary/single-unit resources

    delta = max(1, int(total * VARIATION_FRACTION))
    low = max(0, available - delta)
    high = min(total, available + delta)
    return random.randint(low, high)


def main():
    print("=" * 60)
    print("  HRS Resource Refresh Script")
    print("=" * 60)

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT r.resource_id, r.hospital_id, r.resource_type,
                   r.total_count, r.available_count, h.name AS hospital_name
            FROM hospital_resources r
            JOIN hospitals h ON r.hospital_id = h.hospital_id
            ORDER BY r.hospital_id, r.resource_type
            """
        )
        all_rows = cur.fetchall()

    if not all_rows:
        print("No resource rows found. Exiting.")
        sys.exit(0)

    total_rows = len(all_rows)
    sample_size = max(1, total_rows // 2)
    selected = random.sample(all_rows, sample_size)

    print(f"\nTotal resource rows: {total_rows}")
    print(f"Rows to refresh:     {sample_size} (50%)\n")

    now = datetime.utcnow()
    updated_count = 0
    hospitals_touched: set[str] = set()

    with db_cursor() as cur:
        for row in selected:
            new_available = jitter(
                row["available_count"],
                row["total_count"],
                row["resource_type"],
            )
            cur.execute(
                """
                UPDATE hospital_resources
                SET available_count = %s,
                    is_available    = %s,
                    last_updated    = %s
                WHERE resource_id = %s
                """,
                (new_available, new_available > 0, now, row["resource_id"]),
            )
            hospitals_touched.add(row["hospital_name"])
            updated_count += 1

    print(f"Updated {updated_count} resource rows across {len(hospitals_touched)} hospital(s):")
    for name in sorted(hospitals_touched):
        print(f"  - {name}")

    print("\n" + "=" * 60)
    print(f"  Done. last_updated set to {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print("=" * 60)


if __name__ == "__main__":
    main()
