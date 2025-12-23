import sys
import os
from sqlalchemy import text

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.db import SessionLocal

def inspect_db():
    db = SessionLocal()
    try:
        # 1. Check columns
        result = db.execute(text("DESCRIBE pill_identifier"))
        print("\n=== COLUMNS ===")
        found = False
        for row in result:
             # row is likely a tuple (Field, Type, Null, Key, Default, Extra)
             print(f"Col: {row[0]}")
             if row[0] == 'CLASS_NAME' or row[0] == 'class_name':
                 found = True
        
        if found:
            print("\n✅ CLASS_NAME column exists.")
        else:
            print("\n❌ CLASS_NAME column NOT found!")

        # 2. Check Data
        print("\n=== DATA SAMPLE ===")
        # Select first row
        data = db.execute(text("SELECT * FROM pill_identifier LIMIT 1")).mappings().fetchone()
        if data:
            print(f"Keys: {data.keys()}")
            print(f"CLASS_NAME value: {data.get('CLASS_NAME')} / {data.get('class_name')}")
        else:
            print("No data in table.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_db()
