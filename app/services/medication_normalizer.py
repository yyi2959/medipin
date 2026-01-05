import re
from typing import List, Dict


def normalize_medications(parsed_text: dict | list) -> List[Dict]:
    """
    약봉투 / 처방전 파싱 결과를 표준화된 약 데이터 리스트로 변환
    """
    normalized = []

    # 🚨 방어 코드: parsed_text가 리스트인 경우 딕셔너리로 래핑
    if isinstance(parsed_text, list):
        medicines = parsed_text
        timing_info = []
        meal_info = ""
        base_dict = {}
    else:
        # 'medicines' 또는 'medications' 키 모두 확인 가능하도록 수정
        medicines = parsed_text.get("medicines") or parsed_text.get("medications") or []
        timing_info = parsed_text.get("timing", [])
        meal_info = parsed_text.get("meal_relation", "")
        base_dict = parsed_text

    for med in medicines:
        # 개별 아이템이 리스트인 경우 등 예외 케이스 방지
        if not isinstance(med, dict):
            continue

        name = clean_med_name(med.get("name", ""))
        dose = normalize_dose(med.get("dose", "1정"))
        
        # 'timing' 정보가 med 안에 있으면 그것을 우선 사용, 없으면 상위 정보 사용
        raw_timing = med.get("timing", "") or (timing_info[0] if timing_info else "")
        freq = normalize_frequency(str(raw_timing))

        normalized.append({
            "name": name,
            "dose": dose,
            "frequency_per_day": freq["count"],
            "timing": freq["timings"],
            "meal_relation": med.get("meal_relation") or meal_info or "식후 30분",
            "days": base_dict.get("days", 3) # 기본 3일
        })

    return normalized


# ------------------------------
# 아래는 내부 헬퍼 함수들
# ------------------------------

def clean_med_name(name: str) -> str:
    """약 이름 정제"""
    name = name.replace("정", "").strip()
    name = re.sub(r"\(.*?\)", "", name)
    return name


def normalize_dose(dose: str) -> str:
    """투약량 정규화"""
    if "½" in dose or "0.5" in dose:
        return "0.5정"

    numbers = re.findall(r"\d+\.?\d*", dose)
    if numbers:
        return f"{numbers[0]}정"

    return "1정"


def normalize_frequency(text: str) -> dict:
    """
    복용 횟수 / 시간대 파싱
    """
    timings = []
    count = 1

    if "아침" in text:
        timings.append("아침")
    if "점심" in text:
        timings.append("점심")
    if "저녁" in text:
        timings.append("저녁")
    if "취침" in text:
        timings.append("취침전")

    if "1일 2회" in text or "BID" in text:
        count = 2
    elif "1일 3회" in text or "TID" in text:
        count = 3
    elif "QD" in text:
        count = 1

    if not timings:
        timings = ["아침"]

    return {
        "count": count,
        "timings": timings
    }
