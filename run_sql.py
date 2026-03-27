import sys
import os

# Add Backend to python path to import core.db
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'Backend')))

from core.db import get_conn, release_conn

def run_sql_file(filepath):
    print(f"Running {filepath}...")
    with open(filepath, 'r') as f:
        sql = f.read()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            if cur.description: # If it returns rows (like seed_resources does)
                results = cur.fetchall()
                for r in results:
                    print(r)
        conn.commit()
        print(f"Success: {filepath}")
    except Exception as e:
        conn.rollback()
        print(f"Error running {filepath}: {e}")
    finally:
        release_conn(conn)

if __name__ == '__main__':
    base_dir = '/Users/margehagan/Documents/ashesi-capstone-hospital-routing-system'
    run_sql_file(os.path.join(base_dir, 'database/migration_new_bed_types.sql'))
    run_sql_file(os.path.join(base_dir, 'database/seed_resources.sql'))
