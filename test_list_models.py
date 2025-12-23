
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

with open("model_list.log", "w", encoding="utf-8") as f:
    f.write("Listing available models...\n")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
                
        f.write("\nTesting gemini-pro...\n")
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Hello")
            f.write(f"Response: {response.text}\n")
        except Exception as e:
            f.write(f"Error testing gemini-pro: {e}\n")
            
    except Exception as e:
        f.write(f"Error listing models: {e}\n")
