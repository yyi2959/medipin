def detect_document_type(text: str) -> str:
    # 🚨 처방전 키워드
    keywords_prescription = [
        "처방전", "Rx", "의사", "병원", "진료과", "처방일", "교부번호"
    ]

    # 🚨 약봉투 키워드 (고도화)
    keywords_bag = [
        "약품명", "복약안내", "복용법", "정씩", "약품사진", "주의사항", 
        "식후", "식전", "아침", "점심", "저녁", "취침전", "일분", "회분"
    ]

    # 약봉투 키워드 가중치 체크
    bag_score = sum(1 for k in keywords_bag if k in text)
    presc_score = sum(1 for k in keywords_prescription if k in text)

    if presc_score > 0 and presc_score >= bag_score:
        return "prescription"
    elif bag_score > 0:
        return "medicine_bag"

    return "unknown"
