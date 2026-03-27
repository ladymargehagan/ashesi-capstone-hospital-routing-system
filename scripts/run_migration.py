import sys, os
sys.path.append(os.path.abspath('Backend'))
from core.db import get_conn, release_conn

conn = get_conn()
cur = conn.cursor()
with open('database/migration_admin_invites.sql', 'r') as f:
    sql = f.read()
cur.execute(sql)
conn.commit()
print("Migration applied successfully.")
