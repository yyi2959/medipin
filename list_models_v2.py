
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Listing models...")
try:
    for m in client.models.list():
        if "generateContent" in m.supported_actions:
            print(m.name)
except Exception as e:
    print(e)
