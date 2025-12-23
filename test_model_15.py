
import os
import google.generativeai as genai
from app.config import settings

def test_model():
    key = settings.GEMINI_API_KEY
    print(f"Key available: {bool(key)}")
    genai.configure(api_key=key)
    
    # Try 1.5 Flash
    models_to_try = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-flash-latest']
    
    for m_name in models_to_try:
        print(f"\nTesting model: {m_name}")
        try:
            model = genai.GenerativeModel(m_name)
            response = model.generate_content("Hello")
            print(f"SUCCESS with {m_name}: {response.text}")
            return
        except Exception as e:
            print(f"FAILED with {m_name}: {e}")

if __name__ == "__main__":
    test_model()
