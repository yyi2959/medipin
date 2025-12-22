# app/routers/user.py (오류 수정 및 최종 정리)

from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from app.db import get_db
from app.security.jwt_handler import get_current_user

from app.models.user import UserProfile
from app.services.user_service import update_user_profile_detail, get_user_profile 
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserBase

user_router = APIRouter(prefix="/user", tags=["User Profile"])


@user_router.get("/profile", response_model=UserBase)
def get_user_full_profile( # 🚨 4번 오류 해결: 함수명 변경
    current_user: UserProfile = Depends(get_current_user)
):
    """ 현재 로그인된 사용자(또는 가족)의 프로필 정보 및 기본 데이터를 조회합니다. """
    return current_user

# 🚨 2. 가족 구성원 목록 조회 엔드포인트
@user_router.get("/family", response_model=list[UserProfileResponse])
def get_my_family_list(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """ 본인이 소유한 모든 가족 구성원 목록을 반환합니다. """
    # get_family_members 서비스 함수가 필요합니다. (서비스 파일에 추가해야 함)
    family_members = db.query(UserProfile).filter(UserProfile.user_id == current_user.id, UserProfile.id != current_user.id).all()
    return family_members # 임시로 쿼리 직접 사용

from app.schemas.user import FamilyMemberRequest
import uuid

@user_router.post("/family", response_model=UserProfileResponse)
def create_family_member(
    request: FamilyMemberRequest,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """ 가족 구성원을 추가합니다. """
    try:
        # 이메일은 Unique 제약조건이 있으므로 더미 이메일 생성
        dummy_email = f"family_{uuid.uuid4()}@dummymedipin.com"
        
        new_member = UserProfile(
            user_id=current_user.id, # 주사용자와 연결
            name=request.name,
            email=dummy_email,
            hashed_password="family_member_pwd", # 더미 비번
            age=request.age,
            birth_date=request.birth_date,
            gender=request.gender,
            height=request.height,
            weight=request.weight,
            special_note=request.special_note
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        return new_member
    except Exception as e:
        import traceback
        with open("debug_error.log", "w", encoding="utf-8") as f:
            f.write(str(e))
            f.write(traceback.format_exc())
            
        print(f"Error creating family member: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create family member: {str(e)}")

# =======================================================
# 🚨 3. 프로필 상세 정보 수정 (이름, 이메일, 비밀번호 등)
# =======================================================
@user_router.put("/profile/detail", response_model=UserBase)
def update_profile_detail(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """ 이름, 비밀번호, 이메일, 생년월일, 성별 등 상세 정보를 수정합니다. """
    try:
        updated_user = update_user_profile_detail(db, current_user.id, update_data)
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로필 수정 중 오류 발생: {e}")