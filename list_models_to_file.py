
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyC970H5bbENl1y2ku8NYLeon7kaXz9WyMQ"
genai.configure(api_key=api_key)

try:
    with open("available_models.txt", "w", encoding="utf-8") as f:
        f.write(f"API Key: {api_key[:10]}...\n")
        f.write("--- Available Models ---\n")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
    print("Done writing available_models.txt")
except Exception as e:
    print("Error listing models:", e)
