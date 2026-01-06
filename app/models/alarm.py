from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db import Base

class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedule.id", ondelete="CASCADE"), nullable=False)
    alarm_time = Column(DateTime, nullable=False)  # YYYY-MM-DD HH:MM:SS
    message = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
