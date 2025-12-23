from sqlalchemy import create_engine, text, inspect
import sys
import os

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:mysqlbig@localhost/medipin"

def debug_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    print("--- Inspecting 'user_profile' columns ---")
    insp = inspect(engine)
    columns = insp.get_columns('user_profile')
    for c in columns:
        print(f"{c['name']} - {c['type']}")
    
    print("\n--- Attempting Test Insertion ---")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Get an existing user ID to link to
            res = conn.execute(text("SELECT id FROM user_profile LIMIT 1"))
            row = res.fetchone()
            if not row:
                print("No users found to link to.")
                return

            parent_id = row[0]
            print(f"Found parent user id: {parent_id}")

            # 2. Try simple insert
            # Note: We use dummy values
            dummy_email = f"debug_{parent_id}_123@test.com"
            sql = text("""
                INSERT INTO user_profile (email, hashed_password, name, user_id, age)
                VALUES (:email, 'dummy', 'Debug Child', :pid, 5)
            """)
            conn.execute(sql, {"email": dummy_email, "pid": parent_id})
            print("Insertion successful (Rolling back now).")
            trans.rollback()
        except Exception as e:
            print(f"Insertion failed: {e}")
            trans.rollback()

if __name__ == "__main__":
    debug_schema()
