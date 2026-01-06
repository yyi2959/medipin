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
    ).all()
    return alarms

@router.post("/{alarm_id}/read")
def mark_alarm_read(alarm_id: int, db: Session = Depends(get_db)):
    """
    알림을 읽음(완료) 상태로 변경
    """
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    alarm.is_read = True
    db.commit()
    return {"status": "success", "message": "Alarm marked as read"}
