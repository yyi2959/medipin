# app/routers/chatbot.py (신규 파일)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.security.jwt_handler import get_current_user
from app.models.user import UserProfile
from app.models.chat_history import ChatHistory

# 🚨 schemas 파일이 존재한다고 가정
from app.schemas.chatbot import ChatRequest, ChatResponse

# 🚨 서비스 파일 임포트 (이 파일은 모델을 파일 상단에서 임포트하지 않아야 함)
from app.services.chatbot_service import generate_chatbot_response 


chatbot_router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

@chatbot_router.post("/", response_model=ChatResponse)
def chatbot_query(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    로그인한 주사용자의 질문에 대해 DB 정보를 기반으로 답변합니다.
    (JWT 인증 필요)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증되지 않은 사용자입니다."
        )

    try:
        response_text = generate_chatbot_response(
            db, 
            user_id=current_user.id, 
            question=payload.question
        )
    except Exception as e:
        # 서비스 레이어에서 발생한 오류 처리
        print(f"Chatbot Service Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"챗봇 서비스 처리 중 오류가 발생했습니다: {e}" 
        )
    
    return {"response": response_text}

@chatbot_router.get("/history")
def get_chatbot_history(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    로그인한 사용자의 채팅 기록을 가져옵니다.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증되지 않은 사용자입니다."
        )

    history = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.created_at.desc()).all()
    
    return history

@chatbot_router.post("/read")
def mark_as_read(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    사용자의 읽지 않은 메시지를 읽음 처리합니다.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증되지 않은 사용자입니다."
        )

    db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id,
        ChatHistory.is_read == False,
        ChatHistory.sender == "bot"
    ).update({"is_read": True})
    
    db.commit()
    return {"status": "success"}