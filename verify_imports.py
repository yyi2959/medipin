
import sys
import traceback

try:
    print("Importing app.db...")
    from app.db import Base
    
    # Match verify_gemini.py order
    print("Importing app.models.medication...")
    from app.models import medication

    print("Importing app.models.user...")
    from app.models import user
    
    from app.models import map
    from app.models import drug_info
    
    print("Configuring mappers...")
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    
    print("All imports and config successful.")
except Exception:
    traceback.print_exc()
