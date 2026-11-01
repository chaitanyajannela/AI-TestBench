import os
import httpx
from app.llm.base import LLMProvider

class OpenAICompatibleProvider(LLMProvider):
    def __init__(
        self,
        name: str = "openai",
        api_key: str | None = None,
        base_url: str = "https://api.openai.com/v1",
        default_model: str = "gpt-4o-mini",
    ):
        self._name = name
        self.api_key = api_key or os.getenv(f"{name.upper()}_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
        self.base_url = (os.getenv(f"{name.upper()}_BASE_URL") or base_url).rstrip("/")
        self.model = os.getenv(f"{name.upper()}_MODEL") or default_model

    def provider_name(self) -> str:
        return self._name

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
            raise RuntimeError(f"{self._name.capitalize()} API key is not configured.")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        body: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
