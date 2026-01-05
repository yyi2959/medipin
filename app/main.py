from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
# Trigger reload 3
from fastapi.middleware.cors import CORSMiddleware
import logging

logger = logging.getLogger("uvicorn.error")

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
    allow_origins=["*"],
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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    logger.error(f"422 Unprocessable Content: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )
