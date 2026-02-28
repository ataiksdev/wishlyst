import os
import psycopg2
import psycopg2.extras
from fastapi import HTTPException

def get_db():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set in environment variables")
        raise HTTPException(status_code=500, detail="Database configuration missing")
    
    # Handle postgres:// vs postgresql:// if needed
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        conn = psycopg2.connect(
            db_url,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )
        yield conn
    except psycopg2.Error as e:
        print(f"DATABASE CONNECTION ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()
