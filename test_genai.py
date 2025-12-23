
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    # Try reading directly from .env if load_dotenv failed (though it shouldn't)
    print("Trying manual read of .env...")
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY"):
                print(f"Found in file: {line.strip()}")
                api_key = line.split("=")[1].strip().strip('"')

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
