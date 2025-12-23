
import google.generativeai as genai

key = "gen-lang-client-0965851102"
print(f"Testing key: {key}")

try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
