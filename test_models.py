import google.generativeai as genai
import util
import os

print("Using API Key:", util.GOOGLE_API_KEY[:5] + "..." if util.GOOGLE_API_KEY else "None")
genai.configure(api_key=util.GOOGLE_API_KEY)

try:
    models = genai.list_models()
    print("\nAvailable models for generateContent:")
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(" -", m.name)
except Exception as e:
    print("Error listing models:", e)
