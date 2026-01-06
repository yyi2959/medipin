from sqlalchemy import Column, Integer, String, Date, Text, Time, ForeignKey, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class ActiveMedication(Base):
    __tablename__ = "active_medication"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profile.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # PatientProfile과의 관계
    patient = relationship("PatientProfile", back_populates="active_medications")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedule"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    pill_name = Column(String(255), nullable=True)
    dose = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    
    # 다중 복약 시간 (00:00 형식 문자열 권장)
    timing1 = Column(String(50), nullable=True)
    timing2 = Column(String(50), nullable=True)
    timing3 = Column(String(50), nullable=True)
    timing4 = Column(String(50), nullable=True)
    timing5 = Column(String(50), nullable=True)
    
    meal_relation = Column(String(100), nullable=True)
    memo = Column(Text, nullable=True)
    notify = Column(Boolean, server_default="1")
    is_taken = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=True)

    # I will not add a relationship to ActiveMedication if the schema doesn't match.
    # But usually a schedule is derived from a prescription.
    # The schema `medication_schedule` seems to be for "Push Notifications" or "Calendar Events"
    # while `active_medication` is "Current Prescription List".
    # I'll keep them separate as per schema.
    
