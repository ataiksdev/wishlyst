import os
import sys
from dotenv import load_dotenv

# Add the current directory to path so we can import api
sys.path.append(os.getcwd())

load_dotenv()

try:
    import psycopg2
    db_url = os.environ.get("DATABASE_URL")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("Connected to database. Applying fix...")
    cur.execute("ALTER TABLE wishlist_views ALTER COLUMN viewer_ip TYPE TEXT;")
    conn.commit()
    print("Successfully changed wishlist_views.viewer_ip to TEXT.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
