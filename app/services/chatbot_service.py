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
                sch_text += f"- {s.pill_name} ({s.dose}): {s.start_date} {s.timing or ''}\n"
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
            timing=notes,
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
def generate_chatbot_response(db: Session, user_id: int, question: str) -> str:
    # 1. 사용자 정보
    user_summary = get_user_summary(db, user_id)
    if not user_summary:
        return "사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요."
    
    name = user_summary['name']
    age = user_summary['age']
    note = user_summary['special_note'] or "없음"
    
    # 2. RAG Context 구성
    rag_data = fetch_rag_context(db, user_id, question)
    
    # 3. 프롬프트 작성
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
      "medication_name": "약 이름 (사용자가 말한 약 이름)",
      "start_date": "YYYY-MM-DD (오늘 날짜 기준 계산)",
      "notes": "시간 정보 (예: 오후 2시, 점심 식후 등)",
      "dose": "용량 (예: 1정)"
    }}

    [데이터 근거]
    {rag_data}

    데이터에 없는 내용은 일반적인 의학 지식이나 상식 선에서 정중하게 답변하되, 
    "제공된 데이터에는 없지만..." 처럼 명시해주세요.
    답변은 한국어로, 친근한 존댓말(해요체)를 사용해주세요.
    """
    
    user_prompt = f"사용자 질문: {question}"
    
    # 4. Gemini 호출
    try:
        api_key = settings.GEMINI_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            
            # 'gemini-1.5-flash' returned 404 (Not Found) for this API key.
            # Switching to 'gemini-flash-latest' which was confirmed as available in the model list.
            model = genai.GenerativeModel('gemini-flash-latest')
        else:
             return "챗봇 엔진(Gemini)이 설정되지 않았습니다."

        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = model.generate_content(full_prompt)

        text_response = response.text.strip()
        
        # JSON 응답 감지 및 처리
        # Markdown code block 제거 ```json ... ```
        if "REGISTER_SCHEDULE" in text_response:
            try:
                # { ... } 패턴 찾기
                match = re.search(r"\{.*\}", text_response, re.DOTALL)
                if match:
                    json_str = match.group()
                    data = json.loads(json_str)
                    
                    if data.get("intent") == "REGISTER_SCHEDULE":
                        return create_schedule(db, user_id, data, name)
            except Exception as e:
                print(f"JSON Parsing Error: {e}")
                # JSON 파싱 실패 시 텍스트 응답 그대로 반환하거나 에러 메시지
                pass

        return text_response
        
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini API Error: {error_msg}")
        
        if "429" in error_msg or "Resource has been exhausted" in error_msg:
            return "죄송합니다. 현재 AI 서비스 사용량이 많아 잠시 후 다시 시도해 주세요. (Quota Exceeded)"
            
        return "죄송합니다. 답변을 생성하는 도중 문제가 발생했습니다. (Error: " + error_msg[:50] + "...)"
