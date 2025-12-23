
from app.db import SessionLocal
from sqlalchemy import text
try:
    db = SessionLocal()
    res = db.execute(text("SELECT id, email, name FROM user_profile")).mappings().all()
    for row in res:
        print(f"User: {row}")
except Exception as e:
    print("Error:", e)
