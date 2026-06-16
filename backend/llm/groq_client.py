import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if groq_api_key is None:
    raise RuntimeError("GROQ_API_KEY is not set in the environment")

client = Groq(api_key=groq_api_key)
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def call_groq(prompt: str, system: str = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=2048,
    )
    return response.choices[0].message.content