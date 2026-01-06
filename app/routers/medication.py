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

@router.post("/schedule")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """
    복약 일정 생성 - 시작일부터 종료일까지 매일 개별 레코드 생성
    """
    from datetime import timedelta
    
    # 날짜 검증
    if not schedule.start_date or not schedule.end_date:
        raise HTTPException(status_code=400, detail="start_date and end_date are required")
    
    if schedule.start_date > schedule.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")
    
    # 기간 내 모든 날짜 순회하며 레코드 생성
    current_date = schedule.start_date
    created_count = 0
    skipped_count = 0
    created_schedules = []
    
    while current_date <= schedule.end_date:
        # 중복 체크: 동일 사용자, 동일 약 이름, 동일 날짜
        existing = db.query(MedicationSchedule).filter(
            MedicationSchedule.user_id == schedule.user_id,
            MedicationSchedule.pill_name == schedule.pill_name,
            MedicationSchedule.start_date == current_date
        ).first()
        
        if existing:
            skipped_count += 1
        else:
            # 새 레코드 생성
            db_schedule = MedicationSchedule(
                user_id=schedule.user_id,
                pill_name=schedule.pill_name,
                dose=schedule.dose,
                start_date=current_date,
                end_date=current_date,  # 각 레코드는 하루 단위
                timing=schedule.timing,
                meal_relation=schedule.meal_relation,
                memo=schedule.memo,
                notify=schedule.notify,
                is_taken=False
            )
            db.add(db_schedule)
            created_schedules.append(db_schedule)
            created_count += 1
        
        current_date += timedelta(days=1)
    
    # 모든 레코드 커밋
    if created_count > 0:
        db.commit()
        for sched in created_schedules:
            db.refresh(sched)
    
    # 응답: 첫 번째 생성된 일정 정보 + 메타데이터
    if created_schedules:
        response = created_schedules[0]
        # 메시지를 응답 객체에 추가하기 위해 dict로 변환 후 메시지 추가
        response_dict = {
            "id": response.id,
            "user_id": response.user_id,
            "pill_name": response.pill_name,
            "dose": response.dose,
            "start_date": response.start_date,
            "end_date": response.end_date,
            "timing": response.timing,
            "meal_relation": response.meal_relation,
            "memo": response.memo,
            "notify": response.notify,
            "is_taken": response.is_taken,
            "created_at": response.created_at,
            "message": f"총 {created_count}일간의 복약 일정이 등록되었습니다. (중복 제외: {skipped_count}건)"
        }
        return response_dict
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"모든 일정이 이미 등록되어 있습니다. (중복 제외: {skipped_count}건)"
        )

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
