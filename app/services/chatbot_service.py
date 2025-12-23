# app/services/chatbot_service.py (최종 완성 코드 - 지연 로딩 적용)

from sqlalchemy.orm import Session, joinedload
from typing import Optional, Dict, Any

from sqlalchemy import text, func
from datetime import date
from app.services.drug_safety_service import check_drug_safety_for_user 
from app.services.medication_service import register_medication_schedule, delete_medication_schedule
from app.models.medication import MedicationSchedule
from app.models.map import MasterMedical

# =======================================================
# 1. 보조 함수: 사용자 요약 정보 조회 (get_user_summary)
# =======================================================

def get_user_summary(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """ 주사용자와 가족 구성원의 간략한 정보를 조회하고, 특이사항을 포함합니다. """
    
    # 🚨 지연 로딩
    from app.models.user import UserProfile, PatientProfile
    
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    
    if user:
        # 주사용자의 가족 구성원 (UserProfile 테이블에서 조회)
        members = db.query(UserProfile).filter(UserProfile.user_id == user_id, UserProfile.id != user_id).all()
        
        # 주사용자 본인의 특이사항 조회 (PatientProfile 테이블 사용. relation='Self')
        # Assuming one PatientProfile per user with relation 'Self' created at registration
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == user_id, PatientProfile.relation == "Self").first()
        patient_note = patient.special_note if patient else None
        
        member_names = [m.name for m in members]
        
        return {
            "name": user.name,
            "age": user.age,
            "special_note": patient_note,
            "family_members": member_names,
            "profile_id": user.id # This is UserProfile ID
            # Note: For strict logic, we might need PatientProfile ID for ActiveMedication lookups
        }
    return None

# =======================================================
# 2. 보조 함수: 복용 약물 이름 목록 조회 (get_profile_medications)
# =======================================================

def get_profile_medications(db: Session, profile_id: int) -> list[str]:
    """ 특정 프로필(PatientProfile ID)이 복용 중인 약물의 이름을 조회합니다. """
    
    # 🚨 지연 로딩
    from app.models.medication import ActiveMedication
    
    # ActiveMedication에는 medication_name이 직접 저장되어 있습니다.
    # profile_id should be patient_id here. 
    # If caller passes UserProfile.id, this query might fail if patient_id != user_profile.id.
    # However, currently register_user creates PatientProfile.id (auto inc) which might be different from UserProfile.id.
    # The 'profile_id' argument here implies PatientProfile ID.
    
    meds = db.query(ActiveMedication).filter(
        ActiveMedication.patient_id == profile_id
    ).all()
    
    return [m.medication_name for m in meds if m.medication_name]


# =======================================================
# 3. 핵심 함수: 챗봇 응답 생성 (generate_chatbot_response)
# =======================================================

import re

# ... existing code ...

# =======================================================
# 4. 자연어 파싱 헬퍼: 복약 등록 명령어 분석
# =======================================================
def parse_registration_command(message: str) -> dict:
    """ 
    "내일 아스피린 12시 30분 등록해줘" 형태의 메시지 파싱 
    Returns: {'pill_name': str, 'time': str, 'period': str}
    """
    # 1. 시간 추출 (Regex) - "12시", "12:30"
    time_str = None
    time_match = re.search(r"(\d{1,2})시\s*(\d{0,2})", message)
    if time_match:
        hour = int(time_match.group(1))
        minute_str = time_match.group(2)
        minute = int(minute_str) if minute_str else 0
        time_str = f"{hour:02d}:{minute:02d}"
    else:
        # "12:30" 형태
        time_match_colon = re.search(r"(\d{1,2}):(\d{2})", message)
        if time_match_colon:
            time_str = f"{int(time_match_colon.group(1)):02d}:{time_match_colon.group(2)}"
    
    if not time_str:
        time_str = "09:00" # 기본값

    # 2. 약 이름 추출 (Heuristic)
    # "등록", "해줘", "추가" 제거
    cleaned = re.sub(r"(등록|해줘|추가|약|시간|에)", "", message)
    # 시간 부분 제거
    if time_match:
        cleaned = cleaned.replace(time_match.group(0), "")
    
    pill_name = cleaned.strip()
    if not pill_name:
        pill_name = "영양제" # 기본값
        
    return {"pill_name": pill_name, "time": time_str}

# =======================================================
# 3. 핵심 함수: 챗봇 응답 생성 (generate_chatbot_response)
# =======================================================

def generate_chatbot_response(db: Session, user_id: int, question: str) -> str:
    try:
        user_summary = get_user_summary(db, user_id)
        if not user_summary:
            return "사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요."
        
        from app.models.user import PatientProfile
        patient_profile = db.query(PatientProfile).filter(PatientProfile.user_id == user_id, PatientProfile.relation == "Self").first()
        current_patient_id = patient_profile.id if patient_profile else None
        
        q = question.lower().strip()
        name = user_summary['name']

        # === D. 약물 일반 정보 검색 (신규 추가) === 
        # "타이레놀 정보" "이즈펜 효능" 등
        # 순서상 상호작용보다 먼저 혹은 적절한 위치. 상호작용은 "같이 먹어도" 키워드가 강함.
        drug_keywords = ["정보", "효능", "효과", "부작용", "주의사항", "어떤 약"]
        if "약" not in q and any(k in q for k in drug_keywords):
             pass # "약" 이라는 단어가 없어도 검색하고 싶다면 pass. 
             # 하지만 단순 "정보 알려줘"는 너무 광범위. 
             # 여기서는 (약 이름 추정) + (키워드) 조합이 필요함.
             # 간단히: "정보" 키워드가 있고, 약 이름이 감지되면? 
             # 혹은 단순히 텍스트에서 약 이름을 찾아내는 것이 핵심.
        
        # 간단한 로직: 질문에서 2글자 이상 명사를 추출해서 DB에서 검색
        # 여기서는 "정보" or "효능" 키워드가 있으면 수행.
        if any(k in q for k in drug_keywords):
            # 검색어 추출 (질문 전체를 검색어로 쓰되, 조사나 공통어구 제거 필요)
            # 일단 LIKE 검색이므로 대략적인 키워드로 검색 시도
            # ex: "타이레놀 정보 알려줘" -> "타이레놀"
            
            search_term = q
            for k in drug_keywords + ["알려줘", "뭐야", "검색", "해줘", "보여줘", "정보", "약"]:
                 search_term = search_term.replace(k, "")
            search_term = search_term.strip()
            
            if len(search_term) >= 2:
                from app.models.drug_info import ProductLicense
                # ProductLicense 테이블 (item_name) 검색
                found_drug = db.query(ProductLicense).filter(
                    ProductLicense.item_name.like(f"%{search_term}%")
                ).first()
                
                if found_drug:
                    # 정보 구성
                    info_msg = f"'{found_drug.item_name}'에 대한 정보입니다.\n"
                    if found_drug.entp_name:
                         info_msg += f"- 제조사: {found_drug.entp_name}\n"
                    if found_drug.ingr_name:
                         info_msg += f"- 성분: {found_drug.ingr_name}\n"
                    if found_drug.induty:
                         info_msg += f"- 분류: {found_drug.induty}\n"
                    
                    return info_msg
                else:
                     # 검색 실패 시 아래 로직으로 넘어감 (or 없다고 리턴)
                     pass

        # === F. 복약 일정 등록 의도 (개선됨) ===
        if any(k in q for k in ["등록", "추가"]) and any(k in q for k in ["약", "먹을", "스케줄"]):
            parsed = parse_registration_command(q)
            pill_name = parsed['pill_name']
            schedule_time = parsed['time']
            
            # 간소화된 등록 로직 직접 구현 (Service 복잡도 회피)
            from app.models.medication import MedicationSchedule
            
            new_schedule = MedicationSchedule(
                user_id=user_id,
                pill_name=pill_name,
                dose="1정", # 기본값
                start_date=date.today(), # 오늘부터
                end_date=date.today(),   # 일단 1회성 (또는 로직확장 가능)
                timing=schedule_time,
                notify=True
            )
            db.add(new_schedule)
            db.commit()
            
            return f"{name}님, 오늘 {schedule_time}에 '{pill_name}' 복용 일정을 등록했습니다."

        # === G. 복약 일정 삭제 의도 ===
        elif "약 삭제" in q or "복용 중단" in q:
            return "어떤 복약 일정을 삭제하고 싶으신가요? 정확한 복약 ID를 알려주세요."

        # === A. 약물 안전성/상호작용 질문 ===
        elif "상호작용" in q or "같이 먹어도" in q or "금기" in q or "안전" in q:
            if not current_patient_id:
                 return "환자 프로필 정보를 찾을 수 없어 안전성 검사를 수행할 수 없습니다."
                 
            return check_drug_safety_for_user(
                db, 
                profile_id=current_patient_id, 
                drug_name="아스피린", # 임시값 (실제로는 q에서 추출 필요)
                user_age=user_summary['age'], 
                is_pregnant="임신" in q or "임부" in q 
            )
        
        # === B. 복용 스케줄 질문 (키워드 확장) ===
        elif any(k in q for k in ["약", "스케줄", "먹을", "복용"]):
            today = date.today()
            schedules = db.query(MedicationSchedule).filter(
                MedicationSchedule.user_id == user_id,
                MedicationSchedule.start_date == today
            ).all()
            
            if not schedules:
                return f"{name}님, 오늘 등록된 복약 일정이 없습니다."
            
            response_lines = [f"{name}님의 오늘({today}) 복약 일정입니다:"]
            for sch in schedules:
                time_info = f" ({sch.timing})" if sch.timing else ""
                dose_info = f" {sch.dose}" if sch.dose else ""
                response_lines.append(f"- {sch.pill_name}{dose_info}{time_info}")
                
            return "\n".join(response_lines)

        # === H. 병원/응급실 찾기 질문 (키워드 확장) ===
        elif any(k in q for k in ["응급", "병원", "약국", "내과"]):
            keyword = ""
            if "응급" in q: 
                keyword = "응급"
            elif "내과" in q:
                keyword = "내과"
            elif "약국" in q:
                keyword = "약국"
            else:
                keyword = "병원"
                
            results = db.query(MasterMedical).filter(
                (MasterMedical.departments.like(f"%{keyword}%")) | 
                (MasterMedical.name.like(f"%{keyword}%"))
            ).limit(5).all()
            
            if not results:
                return f"죄송합니다. 근처에 '{keyword}' 관련 의료기관을 찾을 수 없습니다."
                
            response_lines = [f"추천하는 '{keyword}' 관련 의료기관입니다:"]
            for place in results:
                response_lines.append(f"- {place.name} (☎ {place.tel})")
                
            return "\n".join(response_lines)
        
        # === C. 개인 특이사항 조회 ===
        elif "특이사항" in q or "알러지" in q or "내 정보" in q:
            note = user_summary.get('special_note')
            if note:
                 return f"{name}님에게 등록된 특이사항은 '{note}' 입니다."
            else:
                 return f"{name}님에게 등록된 특이사항(알러지 등)은 없습니다."

        # === E. 기본 정보 ===
        elif "나이" in q or "몇 살" in q:
            return f"현재 {name}님의 나이는 만 {user_summary['age']}세로 등록되어 있습니다."
        
        elif "가족" in q or "구성원" in q:
            members = user_summary['family_members']
            if members:
                return f"관리 중인 가족 구성원은 {', '.join(members)} 님들이 있습니다."
            else:
                return "현재 등록된 가족 구성원은 없습니다."

        else:
            return f"{name}님, 말씀하신 내용을 잘 이해하지 못했어요. '오늘 약 알려줘' 혹은 '응급실 찾아줘' 처럼 말씀해 보시겠어요?"

    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"Chatbot Logic Error: {error_msg}")
        return f"챗봇 처리 중 오류가 발생했습니다: {str(e)}"