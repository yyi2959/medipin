import sqlalchemy
from sqlalchemy import create_engine, text
import os
import sys

# sys.path.append(os.getcwd())
# from app.db import SQLALCHEMY_DATABASE_URL

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:mysqlbig@localhost/medipin"

def add_column():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SHOW COLUMNS FROM user_profile LIKE 'user_id'"))
            if result.fetchone():
                print("Column 'user_id' already exists in 'user_profile'.")
            else:
                print("Adding 'user_id' column to 'user_profile'...")
                conn.execute(text("ALTER TABLE user_profile ADD COLUMN user_id INT NULL"))
                conn.execute(text("ALTER TABLE user_profile ADD CONSTRAINT fk_user_profile_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id)"))
                print("Column 'user_id' added successfully.")
                conn.commit()
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
