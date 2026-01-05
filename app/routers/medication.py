from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date as date_type, datetime
from app.db import get_db
from app.models.medication import MedicationSchedule

router = APIRouter(prefix="/medication", tags=["Medication"])

# Request Schema
class ScheduleCreate(BaseModel):
    user_id: int
    pill_name: str
    dose: str
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    timing: Optional[str] = None
    meal_relation: Optional[str] = None
    memo: Optional[str] = None
    notify: bool = True
    is_taken: bool = False

class ScheduleUpdate(BaseModel):
    pill_name: Optional[str] = None
    dose: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    timing: Optional[str] = None
    meal_relation: Optional[str] = None
    memo: Optional[str] = None
    notify: Optional[bool] = None
    is_taken: Optional[bool] = None

class ScheduleResponse(BaseModel):
    id: int
    user_id: int
    pill_name: Optional[str]
    dose: Optional[str]
    start_date: Optional[date_type]
    end_date: Optional[date_type]
    timing: Optional[str]
    meal_relation: Optional[str]
    memo: Optional[str]
    notify: Optional[bool]
    is_taken: Optional[bool]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.post("/schedule", response_model=ScheduleResponse)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    db_schedule = MedicationSchedule(
        user_id=schedule.user_id,
        pill_name=schedule.pill_name,
        dose=schedule.dose,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        timing=schedule.timing,
        meal_relation=schedule.meal_relation,
        memo=schedule.memo,
        notify=schedule.notify
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/schedule", response_model=List[ScheduleResponse])
def get_schedules(
    user_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicationSchedule)
    
    if user_id:
        query = query.filter(MedicationSchedule.user_id == user_id)
    
    if year and month:
        # ✅ 해당 월의 시작일과 종료일 계산 (예: 2026-02-01 ~ 2026-02-28)
        import calendar
        from datetime import date as d_type
        
        last_day = calendar.monthrange(year, month)[1]
        month_start = d_type(year, month, 1)
        month_end = d_type(year, month, last_day)

        # ✅ 기간 중첩(Overlap) 로직 적용
        # (시작일 <= 월 종료일) AND (종료일 >= 월 시작일)
        query = query.filter(
            MedicationSchedule.start_date <= month_end,
            MedicationSchedule.end_date >= month_start
        )

    return query.all()

@router.patch("/schedule/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(schedule_id: int, update_data: ScheduleUpdate, db: Session = Depends(get_db)):
    db_schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Exclude unset fields
    update_dict = update_data.dict(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(db_schedule, key, value)
    
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.delete("/schedule/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(db_schedule)
    db.commit()
    return {"status": "success", "message": "Schedule deleted"}
