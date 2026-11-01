from abc import ABC, abstractmethod
from typing import Any

class LLMProvider(ABC):
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. gemini, groq, openrouter, openai, mock)."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if required API keys / endpoints are present."""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        json_mode: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        """Generate text or JSON completion from the LLM."""
        pass
