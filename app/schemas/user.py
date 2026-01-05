from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

# 🚨 EmailStr 대신 str을 사용하기 위해 import에서 제외했습니다.

class UserRegisterRequest(BaseModel):
    email: str  # 👈 EmailStr에서 str로 변경
    password: str
    name: str
    phone_num: str
    age: int

class UserLoginRequest(BaseModel):
    email: str  # 👈 EmailStr에서 str로 변경
    password: str

class UserProfileResponse(BaseModel):
    id: int
    email: str  # 👈 EmailStr에서 str로 변경
    name: str
    phone_num: str
    age: int
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ===============================================
# 2. 마이페이지/프로필 수정 요청 스키마
# ===============================================
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    pw: Optional[str] = None
    email: Optional[str] = None
    phone_num: Optional[str] = None
    birth_date: Optional[date] = None 
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None

class FamilyMemberRequest(BaseModel):
    name: str
    age: Optional[int] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None


# ===============================================
# 3. 응답 스키마 통합
# ===============================================
class UserBase(BaseModel):
    id: int
    name: str
    email: Optional[str] = None  # 👈 EmailStr에서 str로 변경
    phone_num: Optional[str] = None
    age: Optional[int] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(UserBase):
    user_id: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    special_note: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# ===============================================
class UserMe(BaseModel):
    id: int
    email: str 
    name: str
    role: str = "user"
    
    model_config = ConfigDict(from_attributes=True)