from fastapi import FastAPI
# Trigger reload 3
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.routers.auth import auth_router
from app.routers.user import user_router
from app.routers.drugs import drugs_router
from app.routers.ocr import ocr_router
from app.routers.map import map_router
from app.routers.medication import router as medication_router
from app.routers.chatbot import chatbot_router

# 🚨 Ensure all models are imported for Base.metadata.create_all
import app.models.user
import app.models.medication
import app.models.drug_info
import app.models.map
import app.models.refresh_token

app = FastAPI(title="Medipin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https://.*\.ngrok-free\.dev$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (imports)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(drugs_router)
app.include_router(ocr_router)
app.include_router(map_router)
app.include_router(chatbot_router)
app.include_router(medication_router)

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"status": "OK", "message": "Database Connected"}
