
import os
import sys
from app.db import SessionLocal
from app.models.user import UserProfile
from app.security.jwt_handler import create_access_token
from dotenv import load_dotenv

load_dotenv()

def generate_token():
    db = SessionLocal()
    try:
        user = db.query(UserProfile).first()
        if not user:
            print("No users found.")
            return
            
        print(f"User found: {user.email} (ID: {user.id})")
        token = create_access_token({"sub": user.email})
        print(f"\n[Token]:\n{token}")
        
        print("\n[Curl Command]:")
        print(f'curl -X POST "http://localhost:8000/chatbot/" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d "{{\\"question\\": \\"타이레놀 정보 알려줘\\"}}"')
        
    finally:
        db.close()

if __name__ == "__main__":
    generate_token()
