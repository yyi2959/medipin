
import os
import pymysql
import urllib.request
import json
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta

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
            # 1. Get User
            cursor.execute("SELECT email, id FROM user_profile LIMIT 1")
            user = cursor.fetchone()
            if not user:
                print("No user found")
                return

            email = user['email']
            user_id = user['id']
            print(f"User: {email} (ID: {user_id})")

            # 2. Generate Token
            token = create_access_token({"sub": email})

            # 3. Send Request
            url = "http://localhost:8000/chatbot/"
            question = "내일 아침 9시에 타이레놀 2알 먹으라고 등록해줘"
            print(f"\nSending Question: {question}")
            
            data = {"question": question}
            json_data = json.dumps(data).encode("utf-8")
            
            req = urllib.request.Request(url, data=json_data)
            req.add_header("Authorization", f"Bearer {token}")
            req.add_header("Content-Type", "application/json")
            
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode("utf-8")
                print(f"Response: {res_body}")
                with open("test_sched_result.log", "w", encoding="utf-8") as f:
                    f.write(res_body)
                
            # 4. Verify DB Insert
            cursor.execute("SELECT * FROM medication_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user_id,))
            schedule = cursor.fetchone()
            
            print("\n[DB Verification]")
            if schedule:
                print(f"ID: {schedule['id']}")
                print(f"Pill: {schedule['pill_name']}")
                print(f"Date: {schedule['start_date']}")
                print(f"Timing: {schedule['timing']}")
                print(f"Dose: {schedule['dose']}")
            else:
                print("No schedule found in DB!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
