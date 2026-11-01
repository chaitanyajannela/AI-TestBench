import os
from typing import Optional
from app.llm.base import LLMProvider
from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider, OpenRouterProvider
from app.llm.openai_provider import OpenAICompatibleProvider
from app.llm.deterministic_mock_provider import DeterministicMockProvider

def get_llm_provider(requested_provider: Optional[str] = None) -> LLMProvider:
    provider_name = (requested_provider or os.getenv("LLM_PROVIDER") or "").lower()

    if provider_name == "gemini":
        p = GeminiProvider()
        if p.is_configured(): return p
    elif provider_name == "groq":
        p = GroqProvider()
        if p.is_configured(): return p
    elif provider_name == "openrouter":
        p = OpenRouterProvider()
        if p.is_configured(): return p
    elif provider_name == "openai":
        p = OpenAICompatibleProvider()
        if p.is_configured(): return p

    # Auto-detect configured providers if none specified
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return GeminiProvider()
    if os.getenv("GROQ_API_KEY"):
        return GroqProvider()
    if os.getenv("OPENROUTER_API_KEY"):
        return OpenRouterProvider()
    if os.getenv("OPENAI_API_KEY"):
        return OpenAICompatibleProvider()

    # Default to DeterministicMockProvider for robust offline execution & testing
    return DeterministicMockProvider()
