import sys
import os

# Ensure project root is in path
sys.path.append(os.getcwd())

from app.db import engine
from sqlalchemy import text

def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Connection successful:", result.scalar())
    except Exception as e:
        print("Connection failed:", e)

if __name__ == "__main__":
    test_connection()
