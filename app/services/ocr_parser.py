import re

def parse_medication_text(text: str) -> dict:
    """
    약봉투/처방전 텍스트에서 약품명과 용법을 리스트로 추출
    """
    lines = text.split("\n")
    medicines = []

    # 🚨 약품명 추출 패턴: "정", "캡슐", "시럽", "액"으로 끝나거나 "약품명" 뒤에 오는 단어
    # 복용법 패턴: "1정씩 3회 3일분" 등
    
    # 1. 정규표현식을 이용한 약품명 및 용량 일괄 추출 시도
    # 예: "타이레놀정 500mg 1정씩 3회 3일분"
    pattern = re.compile(r"([가-힣\w\s]+(?:정|캡슐|시럽|액|정제))\s*(\d+[\w]*)*\s*(\d+정씩|[\d\.]+정씩)*\s*(\d+회)*\s*(\d+일분)*")
    
    # 줄 단위로 분석
    for line in lines:
        line = line.strip()
        if len(line) < 2: continue
        
        # '약품명' 키워드 뒤의 텍스트 추출 시도
        if "약품명" in line:
            name_part = line.split("약품명")[-1].strip()
            if name_part:
                medicines.append({
                    "name": name_part.split()[0], # 첫 단어만 이름으로 간주
                    "dose": "1정",
                    "timing": "식후 30분",
                    "meal_relation": "식후"
                })
                continue

        # 일반적인 약 이름 패턴 매칭 (정, 캡슐 등)
        match = re.search(r"([가-힣A-Za-z0-9\s]+(?:정|캡슐|시럽|액|정제))", line)
        if match:
            pill_name = match.group(1).strip()
            
            # 용법 매칭 (n정씩 n회 n일분)
            dose_match = re.search(r"([\d\.]+)\s*(?:정|캡슐|알)씩", line)
            freq_match = re.search(r"(\d+)\s*회", line)
            days_match = re.search(r"(\d+)\s*일분", line)
            
            medicines.append({
                "name": pill_name,
                "dose": f"{dose_match.group(1)}정" if dose_match else "1정",
                "timing": f"하루 {freq_match.group(1)}회" if freq_match else "식후 30분",
                "meal_relation": "식후" if "식후" in line else "식전" if "식전" in line else "",
                "days": int(days_match.group(1)) if days_match else 3
            })

    # 중복 제거 및 데이터 정제
    unique_meds = []
    seen_names = set()
    for med in medicines:
        if med["name"] not in seen_names and len(med["name"]) > 1:
            unique_meds.append(med)
            seen_names.add(med["name"])

    return {"medicines": unique_meds}
