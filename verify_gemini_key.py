
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Try to load .env manually to be sure
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded API Key: {api_key[:10]}... (masked)" if api_key else "No API Key found")

if not api_key:
    # Fallback to the one user provided if environment load fails
    api_key = "AIzaSyC970H5bbENl1y2ku8NYLeon7kaXz9WyMQ"
    print(f"Using fallback key: {api_key[:10]}...")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-flash-latest')
    print("Sending request to Gemini...")
    response = model.generate_content("Hello, can you confirm this API key is working?")
    print("Response received:")
    print(response.text)
    print("API Key Verification SUCCESS")
except Exception as e:
    print("\nAPI Key Verification FAILED")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {e}")
    import traceback
    traceback.print_exc()
