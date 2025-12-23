# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_num: str
    age: int

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    phone_num: str
    age: int
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None

    class Config:
        from_attributes = True


# ===============================================
# 2. 마이페이지/프로필 수정 요청 스키마
# ===============================================
class UserProfileUpdate(BaseModel):
    """ 프로필 편집 창에서 사용자 상세 정보 수정 요청 """
    name: Optional[str] = None
    pw: Optional[str] = None
    email: Optional[str] = None # DB 칼럼 이름에 맞춤
    phone_num: Optional[str] = None # DB 칼럼 이름(user.py에서 phone_num으로 가정)에 맞춤
    birth_date: Optional[date] = None 
    gender: Optional[str] = None

class FamilyMemberRequest(BaseModel):
    """ 가족 구성원 등록 요청 스키마 """
    name: str
    age: Optional[int] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None


# ===============================================
# 3. 응답 스키마 (UserBase와 UserProfileResponse 통합)
# ===============================================
# UserBase는 UserProfileResponse의 기초가 되도록 정의합니다.
class UserBase(BaseModel):
    """ 기본 프로필 정보를 위한 스키마 (Base) """
    id: int
    name: str
    email: Optional[EmailStr] = None # EmailStr로 통일
    phone_num: Optional[str] = None
    age: Optional[int] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    
    class Config:
        from_attributes = True

# UserProfileResponse가 UserBase의 역할을 수행하도록 정의
class UserProfileResponse(UserBase):
    """ 마이페이지 조회 시 반환되는 상세 스키마 """
    user_id: Optional[int] = None # 주사용자의 ID (가족 구성원일 경우)
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None
    
    # 🚨 필요하다면 가족 구성원 목록도 여기에 포함 가능
    # family_members: List['UserProfileResponse'] = [] 
    
    class Config:
        from_attributes = True

# ===============================================
class UserMe(BaseModel):
    """
    현재 인증된 사용자의 기본 정보를 반환할 때 사용되는 스키마입니다.
    이 스키마는 auth.py나 __init__.py에서 임포트됩니다.
    """
    id: int
    email: EmailStr
    name: str # user.py에는 name이 있으므로 추가
    role: str = "user" # 기본 역할 명시 (필요하다면)
    
    class Config:
        from_attributes = True