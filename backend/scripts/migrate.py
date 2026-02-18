import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

sql_file = "scripts/007-promoted-wishlists.sql"

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    with open(sql_file, "r") as f:
        cur.execute(f.read())
    conn.commit()
    print("Migration successful")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
