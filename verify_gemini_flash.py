
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyC970H5bbENl1y2ku8NYLeon7kaXz9WyMQ"
genai.configure(api_key=api_key)

print(f"Testing with key: {api_key[:10]}...")

try:
    # Try explicit 1.5 flash model
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Sending request to gemini-1.5-flash...")
    response = model.generate_content("Hello")
    print("Response:", response.text)
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    print(e)
