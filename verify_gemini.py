
import os
import sys

# Ensure app is in path
sys.path.append(os.getcwd())

from app.db import SessionLocal
from app.services.chatbot_service import generate_chatbot_response
from dotenv import load_dotenv

load_dotenv()

# Import all models to ensure they are registered with Base
from app.models import user, medication, map, drug_info

def test_chatbot():
    db = SessionLocal()
    try:
        # Assuming user_id 1 exists. If not, this might fail or return "User not found".
        # We can try to find a user first.
        from app.models.user import UserProfile
        user = db.query(UserProfile).first()
        if not user:
            print("No users found in DB to test with.")
            return

        print(f"Testing with User: {user.name} (ID: {user.id})")
        
        questions = [
            "타이레놀 정보 알려줘",
            "내일 약 일정 있어?",
            "근처 내과 추천해줘"
        ]
        
        for q in questions:
            print(f"\n[Question]: {q}")
            response = generate_chatbot_response(db, user.id, q)
            print(f"[Answer]: {response}")
            print("-" * 30)

    except Exception:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_chatbot()
