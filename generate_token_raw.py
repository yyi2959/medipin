
import os
import pymysql
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "your-very-long-and-secure-secret-key"
ALGORITHM = "HS256"

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        port=int(os.getenv("MYSQL_PORT")),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def main():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT email FROM user_profile LIMIT 1")
            result = cursor.fetchone()
            
        if not result:
            print("No user found in DB")
            return
            
        email = result['email']
        print(f"User Email: {email}")
        
        token = create_access_token({"sub": email})
        print(f"Token: {token}")
        
        # Write curl command to a batch file for easy execution
        cmd = f'curl -X POST "http://localhost:8000/chatbot/" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d "{{\\"question\\": \\"타이레놀 정보 알려줘\\"}}"'
        print("\nCommand:")
        print(cmd)
        
        with open("test_curl.bat", "w", encoding="utf-8") as f:
            f.write("@echo off\n")
            # Escape double quotes for batch file if needed, but simple string usually works
            # curl in windows cmd needs double quotes for body.
            f.write(cmd)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
