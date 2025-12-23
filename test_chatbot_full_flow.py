
import os
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models.user import UserProfile
from app.services.chatbot_service import generate_chatbot_response

# 1. Load Env
load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("ERROR: DATABASE_URL not found")
    exit(1)

# 2. Setup DB
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# 3. Get Test User (ID: 6 - 서지은, as seen in previous check)
user_id = 6
user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
if not user:
    print(f"User {user_id} not found. Picking first user.")
    user = db.query(UserProfile).first()
    if not user:
        print("No users in DB.")
        exit(1)
    user_id = user.id

print(f"Testing with User: {user.name} (ID: {user.id})")

# 4. Simulate Chatbot Interaction
query = "타이레놀 내일 오전 10시 먹을게 등록해줘"
print(f"\n[Test Query]: {query}")

try:
    response = generate_chatbot_response(db, user_id, query)
    print(f"\n[Chatbot Response]:\n{response}")
except Exception as e:
    print(f"\n[Error]: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
