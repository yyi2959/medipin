
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") 
print(f"Key: {api_key[:10]}...")

genai.configure(api_key=api_key)

# 1. Test "gemini-1.5-flash"
try:
    print("\nTesting 'gemini-1.5-flash' ...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("안녕, 연결 확인.")
    print("SUCCESS:", response.text)
except Exception as e:
    print("FAILED 'gemini-1.5-flash':", e)

# 2. Test "models/gemini-1.5-flash"
try:
    print("\nTesting 'models/gemini-1.5-flash' ...")
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    response = model.generate_content("안녕, 연결 확인.")
    print("SUCCESS:", response.text)
except Exception as e:
    print("FAILED 'models/gemini-1.5-flash':", e)

# 3. Test "gemini-pro" (fallback)
try:
    print("\nTesting 'gemini-pro' ...")
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("안녕, 연결 확인.")
    print("SUCCESS:", response.text)
except Exception as e:
    print("FAILED 'gemini-pro':", e)
