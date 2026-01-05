# app/services/calendar_builder.py

from datetime import datetime, date, timedelta


def build_calendar_events(
    schedules: list,
    start_date: date = None,
    days: int = 1,
    alert_level: dict | None = None   # ✅ 추가
):
    """
    복용 시간 목록을 날짜 기준 이벤트로 확장
    """

    if start_date is None:
        start_date = date.today()

    # ✅ 기본 alert_level (없으면 NORMAL)
    if alert_level is None:
        alert_level = {
            "level": "NORMAL",
            "reason": None
        }

    events = []

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)

        for s in schedules:
            # 🚨 1. time 키가 없거나 값이 부적절할 경우를 대비한 예외 처리
            raw_time = s.get("time") or "09:00"
            if not isinstance(raw_time, str) or ":" not in raw_time:
                raw_time = "09:00"

            try:
                hour, minute = map(int, raw_time.split(":"))
            except (ValueError, AttributeError):
                hour, minute = 9, 0
                raw_time = "09:00"

            event_datetime = datetime(
                year=current_date.year,
                month=current_date.month,
                day=current_date.day,
                hour=hour,
                minute=minute
            )

            events.append({
                # ✅ 기존 필드
                "datetime": event_datetime.isoformat(),
                "date": current_date.isoformat(),
                "time": raw_time,
                "title": s.get("label") or s.get("drug_name") or "약 복용",
                "notify": s.get("notify", True),

                # ✅ 핵심 추가
                "alert_level": alert_level["level"],
                "alert_reason": alert_level.get("reason")
            })

    return events
