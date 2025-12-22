from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db import get_db
from app.schemas.user import UserRegisterRequest, UserLoginRequest, UserBase
from app.services.user_service import register_user
from app.models.user import UserProfile
from app.models.refresh_token import RefreshToken
from app.security.password_handler import verify_password
from app.security.jwt_handler import create_access_token, create_refresh_token, get_current_user
from datetime import datetime

auth_router = APIRouter(prefix="", tags=["Authentication"])

@auth_router.post("/register", response_model=UserBase, status_code=status.HTTP_201_CREATED)
def signup(user: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    회원가입 엔드포인트
    """
    try:
        new_user = register_user(db, user)
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/login")
def login(login_request: UserLoginRequest, db: Session = Depends(get_db)):
    """
    로그인 엔드포인트
    """
    # 1. 사용자 확인
    user = db.query(UserProfile).filter(UserProfile.email == login_request.email).first()
    if not user:
         raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    
    # 2. 비밀번호 검증
    if not verify_password(login_request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    
    # 3. 토큰 생성
    access_token = create_access_token(data={"sub": user.email})
    refresh_token_str = create_refresh_token(data={"sub": user.email})
    
    # 4. 리프레시 토큰 DB 저장 (기존 토큰 무효화 로직 등은 정책에 따라 추가 가능)
    # 여기서는 단순 추가
    # expires_at 계산 로직이 jwt_handler에 있으나, 여기서는 DB 저장을 위해 필요함.
    # jwt_handler.REFRESH_TOKEN_EXPIRE_DAYS 상수를 가져오거나 대략적으로 계산
    from app.security.jwt_handler import REFRESH_TOKEN_EXPIRE_DAYS
    from datetime import timedelta
    
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token_str, 
        "token_type": "bearer",
        "user_name": user.name
    }
    
@auth_router.get("/me")
def me(current_user: UserProfile = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
    }