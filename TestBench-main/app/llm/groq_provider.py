import os
from app.llm.openai_provider import OpenAICompatibleProvider

class GroqProvider(OpenAICompatibleProvider):
    def __init__(self, api_key: str | None = None, model: str = "llama-3.3-70b-versatile"):
        super().__init__(
            name="groq",
            api_key=api_key or os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1",
            default_model=model,
        )

class OpenRouterProvider(OpenAICompatibleProvider):
    def __init__(self, api_key: str | None = None, model: str = "meta-llama/llama-3.3-70b-instruct"):
        super().__init__(
            name="openrouter",
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            default_model=model,
        )
