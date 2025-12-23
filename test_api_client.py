
import os
import pymysql
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import urllib.request
import urllib.error

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
        # 1. Get User
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT email FROM user_profile LIMIT 1")
            result = cursor.fetchone()
        conn.close()
            
        if not result:
            print("No user found in DB")
            return
            
        email = result['email']
        print(f"User Email: {email}")
        
        # 2. Generate Token
        token = create_access_token({"sub": email})
        print(f"Token generated.")
        
        # 3. Send Request
        url = "http://localhost:8000/chatbot/"
        data = {"question": "타이레놀 정보 알려줘"}
        json_data = json.dumps(data).encode("utf-8")
        
        req = urllib.request.Request(url, data=json_data)
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Content-Type", "application/json")
        
        print(f"Sending request to {url}...")
        try:
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode("utf-8")
                print("\n[Response Success]")
                # print(res_body)
                with open("api_response.log", "w", encoding="utf-8") as f:
                    f.write(res_body)
        except urllib.error.HTTPError as e:
            print(f"\n[HTTP Error] {e.code}")
            print(e.read().decode("utf-8"))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
