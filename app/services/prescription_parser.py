import re

def parse_prescription_text(text: str) -> dict:
    result = {
        "hospital": None,
        "doctor": None,
        "date": None,
        "medicines": []
    }

    # ✅ 병원명
    hospital_match = re.search(r"(울산\s*대학교병원)", text)
    if hospital_match:
        result["hospital"] = hospital_match.group(1)

    # ✅ 발행일
    date_match = re.search(r"(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)", text)
    if date_match:
        result["date"] = date_match.group(1)

    # ✅ 의사 이름
    doctor_match = re.search(r"의\s*사\s*([\w가-힣]+)", text)
    if doctor_match:
        result["doctor"] = doctor_match.group(1)

    # ✅ 약 라인 파싱
    medicine_lines = text.splitlines()

    for line in medicine_lines:
        if "정" in line and ("아침" in line or "BID" in line or "QD" in line):
            item = {}

            # 약 이름
            name_match = re.search(r"([가-힣A-Za-z\-]+)\s*정", line)
            if name_match:
                item["name"] = name_match.group(1) + " 정"

            # 복용 타이밍
            if "식후" in line:
                item["timing"] = "식후 30분"
            elif "아침" in line:
                item["timing"] = "아침"
            
            # 빈 데이터 방지
            if item:
                result["medicines"].append(item)

    return result
