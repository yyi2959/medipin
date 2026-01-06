from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from pydantic import BaseModel
from app.db import get_db
from app.models.alarm import Alarm

router = APIRouter(prefix="/alarms", tags=["Alarms"])

class AlarmResponse(BaseModel):
    id: int
    user_id: int
    schedule_id: int
    alarm_time: datetime
    message: str
    is_read: bool
    
    # Joined fields
    pill_name: str = None
    is_taken: bool = None
    
    class Config:
        from_attributes = True

@router.get("/pending", response_model=List[AlarmResponse])
def get_pending_alarms(user_id: int, db: Session = Depends(get_db)):
    """
    현재 시간 이전에 발생했으나 아직 확인하지 않은 알림 조회
    """
    now = datetime.now()
    # 1시간 이내의 알림만 조회 (너무 오래된 알림 방지)
    # limit check logic could be added
    alarms = db.query(Alarm).filter(
        Alarm.user_id == user_id,
        Alarm.is_read == False,
        Alarm.alarm_time <= now
    ).order_by(Alarm.alarm_time.asc()).all()
    # Pydantic model will handle extra fields as defaults if not present, 
    # but strictly we should probably query joining if we need pill_name in pending too.
    # For now, let's keep pending simple or update it if needed.
    return alarms

@router.get("/history", response_model=List[AlarmResponse])
def get_alarm_history(user_id: int, db: Session = Depends(get_db)):
    """
    전체 알림 내역 조회 (최신순 정렬)
    약 이름, 복용 여부(is_taken) 포함
    """
    from app.models.medication import MedicationSchedule
    
    # Alarm과 MedicationSchedule 조인
    # .join(MedicationSchedule, Alarm.schedule_id == MedicationSchedule.id)
    # select Alarm.*, MedicationSchedule.pill_name, MedicationSchedule.is_taken
    
    results = db.query(Alarm, MedicationSchedule.pill_name, MedicationSchedule.is_taken)\
        .join(MedicationSchedule, Alarm.schedule_id == MedicationSchedule.id)\
        .filter(Alarm.user_id == user_id)\
        .order_by(Alarm.alarm_time.desc())\
        .all()
    
    response_list = []
    for alarm, pill_name, is_taken in results:
        # Pydantic 모델로 매핑
        resp = AlarmResponse.model_validate(alarm)
        resp.pill_name = pill_name
        resp.is_taken = is_taken
        response_list.append(resp)
        
    return response_list

@router.post("/{alarm_id}/read")
def mark_alarm_read(alarm_id: int, db: Session = Depends(get_db)):
    """
    알림을 읽음(완료) 상태로 변경
    + 연동된 스케줄의 is_taken도 True로 업데이트 (사용자 요구사항 반영: '확인' 시 '복용 완료' 처리)
    """
    from app.models.medication import MedicationSchedule

    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    alarm.is_read = True
    
    # 2026-01-06: 알림 확인 시 복용 완료(is_taken=True)로 자동 업데이트하는 옵션 로직 추가
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == alarm.schedule_id).first()
    if schedule:
        schedule.is_taken = True
        
    db.commit()
    return {"status": "success", "message": "Alarm marked as read and taken"}
