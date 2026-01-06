# app/services/chatbot_service.py (Gemini API Integration - Final)

import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import date
from app.config import settings
import json
import re
import traceback

# =======================================================
# 1. 보조 함수: 사용자 요약 정보 조회
# =======================================================
def get_user_summary(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """ 주사용자와 가족 구성원의 간략한 정보를 조회하고, 특이사항을 포함합니다. """
    from app.models.user import UserProfile, PatientProfile

    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        return None

    members = db.query(UserProfile).filter(UserProfile.user_id == user_id, UserProfile.id != user_id).all()
    patient = db.query(PatientProfile).filter(PatientProfile.user_id == user_id, PatientProfile.relation == "Self").first()
    patient_note = patient.special_note if patient else None
    
    return {
        "name": user.name,
        "age": user.age,
        "special_note": patient_note,
        "family_members": [m.name for m in members]
    }

# =======================================================
# 2. 보조 함수: RAG 데이터 검색 (스케줄, 병원, 약물)
# =======================================================
def fetch_rag_context(db: Session, user_id: int, query: str) -> str:
    """ 사용자 질문과 관련된 DB 데이터를 조회하여 문자열 컨텍스트로 반환 """
    from app.models.medication import MedicationSchedule
    from app.models.map import MasterMedical
    from app.models.drug_info import ProductLicense

    context_parts = []
    today = date.today()

    # A. 복약 스케줄 (오늘/내일 일정)
    if any(k in query for k in ["약", "일정", "스케줄", "먹을", "복용"]):
        schedules = db.query(MedicationSchedule).filter(
            MedicationSchedule.user_id == user_id,
            MedicationSchedule.start_date >= today
        ).limit(5).all()
        
        if schedules:
            sch_text = "=== 사용자 복약 일정 ===\n"
            for s in schedules:
                try:
                    # timing1 ~ timing5 수집
                    t_list = []
                    for i in range(1, 6):
                        val = getattr(s, f"timing{i}", None)
                        if val:
                            t_list.append(str(val))
                    time_info = ", ".join(t_list)
                except Exception:
                    time_info = ""
                
                sch_text += f"- {s.pill_name} ({s.dose}): {s.start_date} {time_info}\n"
            context_parts.append(sch_text)
        else:
            context_parts.append("=== 사용자 복약 일정 ===\n(예정된 일정이 없습니다.)")

    # B. 병원/약국 검색
    medical_keywords = ["병원", "응급", "약국", "내과", "이비인후과", "정형외과", "소아과", "진료"]
    found_medical = False
    for k in medical_keywords:
        if k in query:
            found_medical = True
            break
            
    if found_medical:
        search_keyword = "병원"
        for k in medical_keywords:
            if k in query:
                search_keyword = k
                break
        
        places = db.query(MasterMedical).filter(
            (MasterMedical.name.like(f"%{search_keyword}%")) |
            (MasterMedical.departments.like(f"%{search_keyword}%"))
        ).limit(3).all()
        
        if places:
            med_text = f"=== 추천 의료 기관 ({search_keyword} 관련) ===\n"
            for p in places:
                med_text += f"- {p.name} (전화: {p.tel}, 주소: {p.address})\n"
            context_parts.append(med_text)

    # C. 약물 정보 (이름 검색)
    tokens = query.split()
    for token in tokens:
        clean_token = token.replace("은", "").replace("는", "").replace("이", "").replace("가", "").replace("을", "").replace("를", "")
        if len(clean_token) >= 2:
            drug = db.query(ProductLicense).filter(ProductLicense.item_name.like(f"%{clean_token}%")).first()
            if drug:
                drug_text = f"=== 약물 정보: {drug.item_name} ===\n"
                if drug.entp_name: drug_text += f"제조사: {drug.entp_name}\n"
                if drug.ingr_name: drug_text += f"성분: {drug.ingr_name}\n"
                if drug.induty: drug_text += f"분류: {drug.induty}\n"
                context_parts.append(drug_text)
                break 
    
    return "\n\n".join(context_parts)

# =======================================================
# 3. 보조 함수: 복약 스케줄 등록 및 Active Medication 동기화
# =======================================================
def create_schedule(db: Session, user_id: int, data: dict, user_name: str) -> str:
    from app.models.medication import MedicationSchedule, ActiveMedication
    from app.models.user import PatientProfile

    try:
        # 1. 데이터 파싱
        pill_name = data.get('medication_name') or data.get('pill_name')
        start_date = data.get('start_date')
        notes = data.get('notes') or data.get('timing') 
        dose = data.get('dose', '1회')
        
        print(f"[DEBUG] create_schedule: Pill={pill_name}, Date={start_date}, User={user_name}")

        # 2. MedicationSchedule 등록
        new_schedule = MedicationSchedule(
            user_id=user_id,
            pill_name=pill_name,
            start_date=start_date,
            end_date=start_date,
            timing1=notes, # 챗봇 입력 시간은 timing1에 저장
            memo=notes,
            dose=dose,
            notify=True,
            is_taken=False
        )
        db.add(new_schedule)

        # 3. ActiveMedication 동기화
        patient = db.query(PatientProfile).filter(
            PatientProfile.user_id == user_id, 
            PatientProfile.relation == "Self"
        ).first()

        if patient:
            # ActiveMedication에는 'status' 컬럼이 없으므로 notes 또는 별도 처리가 필요하지만
            # 사용자 요청("상태도 '진행 중'으로")을 반영하여 notes에 기록함.
            status_note = f"{notes} (상태: 진행 중)" if notes else "상태: 진행 중"
            
            new_active = ActiveMedication(
                patient_id=patient.id,
                medication_name=pill_name,
                dosage=dose,
                start_date=start_date,
                end_date=start_date,
                notes=status_note
            )
            db.add(new_active)
            print(f"[DEBUG] ActiveMedication created for patient {patient.id} with status 'Progressing'")
        
        db.commit()
        db.refresh(new_schedule)
        
        # 4. 사용자 피드백 생성
        return f"{user_name}님, {start_date} {notes or ''} {pill_name} 일정을 캘린더에 저장했습니다!"

    except Exception as e:
        db.rollback()
        print("!!! DB INSERT ERROR in create_schedule !!!")
        traceback.print_exc()
        return "죄송합니다. 일정 등록 중 오류가 발생했습니다."

# =======================================================
# 4. 핵심 함수: 챗봇 응답 생성 (Gemini)
# =======================================================
# 전역 변수로 선택된 모델 이름 캐싱
SELECTED_MODEL_NAME = None

def get_best_model():
    global SELECTED_MODEL_NAME
    if SELECTED_MODEL_NAME:
        return SELECTED_MODEL_NAME

    try:
        print("[DEBUG] Searching for available Gemini models...")
        # API 호출이 가능한 모델 검색
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        print(f"[DEBUG] Found models: {available_models}")

        # 우선순위 목록
        preferences = ['models/gemini-1.5-flash', 'gemini-1.5-flash', 'models/gemini-pro', 'gemini-pro']
        
        for pref in preferences:
            for name in available_models:
                # 정확히 일치하거나 name에 포함된 경우 (예: models/gemini-1.5-flash-001)
                if pref == name or name.endswith(pref):
                    SELECTED_MODEL_NAME = name
                    print(f"[DEBUG] ✅ Auto-selected model: {SELECTED_MODEL_NAME}")
                    return SELECTED_MODEL_NAME
        
        # 선호 모델을 찾지 못한 경우 gemini가 포함된 아무 모델이나 선택
        for name in available_models:
            if "gemini" in name.lower():
                SELECTED_MODEL_NAME = name
                print(f"[DEBUG] ⚠️ Fallback to generic Gemini model: {SELECTED_MODEL_NAME}")
                return SELECTED_MODEL_NAME

    except Exception as e:
        print(f"[ERROR] Failed to list models (Check API Key): {e}")
        
    # 기본값 (하드코딩)
    print("[DEBUG] ⚠️ Using default fallback: gemini-pro")
    return 'gemini-pro'

def generate_chatbot_response(db: Session, user_id: int, question: str) -> str:
    from app.models.chat_history import ChatHistory

    # 0. Save User Question to DB
    user_msg = ChatHistory(user_id=user_id, message=question, sender="user")
    db.add(user_msg)
    db.commit()
    
    # 1. 사용자 정보
    user_summary = get_user_summary(db, user_id)
    if not user_summary:
        return "사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요."
    
    name = user_summary['name']
    age = user_summary['age']
    note = user_summary['special_note'] or "없음"
    
    # 2. RAG Context 구성
    rag_data = fetch_rag_context(db, user_id, question)
    
    # 3. 프롬프트 작성 (기존 코드 유지)
    # ... 코드 블록 생략 불가하므로 여기에 다시 포함하거나, 
    # replace 범위를 조정해야 함.
    # 사용자의 시스템 프롬프트가 이전에 정의됨.
    
    system_prompt = f"""
    당신은 친절하고 전문적인 의료 보조 챗봇입니다. 
    사용자의 이름은 {name}이고, 나이는 {age}세입니다.
    특이사항(알러지 등): {note}
    
    사용자가 "약 등록해줘", "먹을게", "알림 설정" 등 복약 일정을 등록하려는 의도를 보이거나,
    구체적인 약 이름과 시간을 언급하며 등록하라고 하면,
    작업을 수행하기 위해 반드시 아래 **JSON 형식**으로만 응답해주세요. 
    다른 말은 덧붙이지 마세요.
    날짜는 오늘({date.today()})을 기준으로 계산해서 YYYY-MM-DD 형식으로 변환하세요.
    
    JSON 형식:
    {{
      "intent": "REGISTER_SCHEDULE",
      "medication_name": "약 이름",
      "start_date": "YYYY-MM-DD",
      "notes": "시간 정보",
      "dose": "용량"
    }}

    [데이터 근거]
    {rag_data}

    데이터에 없는 내용은 일반적인 의학 지식이나 상식 선에서 답변하되, 
    출처가 없음을 명시해주세요. 한국어 해요체를 사용하세요.
    """

    user_prompt = f"사용자 질문: {question}"
    
    # 4. Gemini 호출
    try:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
             api_key = os.getenv("GEMINI_API_KEY")
        
        if api_key:
            # 1. API 키 설정 (필수)
            genai.configure(api_key=api_key)
            
            masked = api_key[:4] + "****" + api_key[-4:] if len(api_key) > 8 else "****"
            print(f"[DEBUG] Using API Key: {masked}")
            
            # 2. 모델 자동 선택
            model_name = get_best_model()
            model = genai.GenerativeModel(model_name)
        else:
            print("[ERROR] GEMINI_API_KEY is missing!")
            return "챗봇 엔진 API 키가 설정되지 않았습니다."

        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        print(f"[DEBUG] Generating content with {model_name or 'default'}...")
        response = model.generate_content(full_prompt)
        
        try:
            text_response = response.text.strip()
        except ValueError:
            print(f"[WARN] Response blocked: {response.prompt_feedback}")
            return "죄송합니다. 안전 정책에 의해 답변이 차단되었습니다."

        # JSON 응답 감지 및 처리
        if "REGISTER_SCHEDULE" in text_response:
            try:
                match = re.search(r"\{.*\}", text_response, re.DOTALL)
                if match:
                    data = json.loads(match.group())
                    if data.get("intent") == "REGISTER_SCHEDULE":
                        final_response = create_schedule(db, user_id, data, name)
                        # Save Bot's final confirmation to history
                        bot_msg = ChatHistory(user_id=user_id, message=final_response, sender="bot")
                        db.add(bot_msg)
                        db.commit()
                        return final_response
            except Exception as e:
                print(f"JSON Parsing Error: {e}")
                pass

        # Regular Bot Response (not schedule)
        bot_msg = ChatHistory(user_id=user_id, message=text_response, sender="bot")
        db.add(bot_msg)
        db.commit()

        return text_response
        
    except Exception as e:
        error_msg = str(e)
        print(f"!!! Gemini API Error !!!: {error_msg}")
        traceback.print_exc()
        
        if "404" in error_msg:
             return f"모델을 찾을 수 없습니다. (Selected: {SELECTED_MODEL_NAME})"
        if "429" in error_msg:
            return "사용량이 많아 잠시 후 다시 시도해 주세요. (429 Too Many Requests)"
            
        return f"문제 발생: {error_msg[:50]}..."
