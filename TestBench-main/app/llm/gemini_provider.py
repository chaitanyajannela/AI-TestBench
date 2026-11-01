import os
import httpx
from app.llm.base import LLMProvider

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str = "gemini-2.0-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
        self.model = model

    def provider_name(self) -> str:
        return "gemini"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        json_mode: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        if not self.is_configured():
            raise RuntimeError("Gemini API key is not configured. Set GEMINI_API_KEY in .env")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"System Instructions:\n{system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body: dict = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"Gemini returned empty candidates: {data}")
            return candidates[0]["content"]["parts"][0]["text"]
