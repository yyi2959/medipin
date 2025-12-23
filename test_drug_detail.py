import sys
import os

# 현재 디렉토리를 sys.path에 추가하여 app 모듈을 찾을 수 있게 함
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.db import SessionLocal
from app.services.drug_service import get_drug_by_id

def test_drug_detail():
    db = SessionLocal()
    try:
        # DB에 존재하는 유효한 item_seq를 하나 찾아야 함.
        # 일단 PillIdentifier 테이블에서 하나 가져오기
        from sqlalchemy import text
        row = db.execute(text("SELECT item_seq FROM pill_identifier LIMIT 1")).fetchone()
        
        if not row:
            print("No data in pill_identifier")
            return

        item_seq = row[0]
        print(f"Testing with item_seq: {item_seq}")

        drug = get_drug_by_id(db, item_seq)
        
        if drug:
            print("Drug Found:")
            print(f"Name: {drug.get('item_name')}")
            print(f"Class Name: {drug.get('class_name')}")
            print("Full Data:", drug)
        else:
            print("Drug Not Found")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_drug_detail()
