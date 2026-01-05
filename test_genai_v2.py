
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def test_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("FAIL: No API Key found.")
        return

    print(f"Testing Google GenAI Client with Key: {api_key[:10]}...")
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Hello, does this library work?'
        )
        print("SUCCESS: Response received.")
        print("Response:", response.text)
    except Exception as e:
        print("FAIL: Error occurred.")
        print(e)
        # Fallback test if 1.5-flash not found
        try:
             print("Retrying with gemini-2.0-flash-exp (optional)...")
             response = client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents='Hello?'
             )
             print("SUCCESS with fallback model.")
        except:
             pass

if __name__ == "__main__":
    test_genai()
