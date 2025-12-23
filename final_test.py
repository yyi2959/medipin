
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyC970H5bbENl1y2ku8NYLeon7kaXz9WyMQ"
genai.configure(api_key=api_key)

print(f"Testing Gemini Connectivity with Key: {api_key[:5]}...{api_key[-5:]}")

# List of models to try
models_to_test = [
    "gemini-1.5-flash", # User requested
    "gemini-1.5-flash-001", # Alternative version
    "gemini-flash-latest", # Verified available
    "gemini-pro",
]

for model_name in models_to_test:
    print(f"\n--- Testing Model: {model_name} ---")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("안녕? 짧게 대답해줘.")
        print(f"SUCCESS: {response.text}")
        break # Stop on first success to identify the working one
    except Exception as e:
        print(f"FAILED: {e}")

print("\nConnection Test Complete.")
