import os
import psycopg2
import glob
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

if not url:
    print("Error: DATABASE_URL is not set.")
    exit(1)

# Get all .sql files sorted by name to ensure order (001, 002, etc.)
sql_files = sorted(glob.glob("scripts/*.sql"))

if not sql_files:
    print("No SQL files found in scripts/")
    exit(0)

print(f"Found {len(sql_files)} migration files.")

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    for sql_file in sql_files:
        print(f"Applying {sql_file}...")
        with open(sql_file, "r") as f:
            try:
                cur.execute(f.read())
                conn.commit() # Commit after each file
            except Exception as e:
                print(f"Error applying {sql_file}: {e}")
                conn.rollback()
                # Continue to next file instead of stopping
                continue
                
    print("Migration process completed.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
