"""
Run migration 009: create notifications table.
Usage:  python scripts/migrate_009.py
        (from the backend/ directory, with DATABASE_URL set in .env)
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

sql_file = "scripts/009-notifications.sql"
url = os.getenv("DATABASE_URL")

if not url:
    raise SystemExit("ERROR: DATABASE_URL is not set in .env")

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    with open(sql_file, "r") as f:
        cur.execute(f.read())
    conn.commit()
    print("✓ Migration 009 (notifications table) applied successfully")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Migration failed: {e}")
