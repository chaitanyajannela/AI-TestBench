import time
import json
from abc import ABC, abstractmethod
from typing import Any, Tuple
import httpx
from fastapi import HTTPException
from app.security import decrypt_secret, validate_public_url

class ChatbotAdapter(ABC):
    @abstractmethod
    async def connect(self) -> bool:
        pass

    @abstractmethod
    async def test_connection(self) -> dict:
        pass

    @abstractmethod
    async def send_message(self, message: str) -> Tuple[str, int, dict]:
        """Returns: (extracted_response_text, latency_ms, raw_response_dict)"""
        pass

    @abstractmethod
    async def send_conversation(self, turns: list[dict]) -> Tuple[str, int, dict]:
        pass

    @abstractmethod
    def normalize_response(self, raw_data: Any) -> str:
        pass

class RestChatbotAdapter(ChatbotAdapter):
    def __init__(self, chatbot_model: Any):
        self.bot = chatbot_model
        self.endpoint_url = str(chatbot_model.endpoint_url)
        self.http_method = (chatbot_model.http_method or "POST").upper()
        self.auth_type = (chatbot_model.authentication_type or "NONE").upper()
        self.request_mapping = chatbot_model.request_mapping or {"message": "message"}
        self.response_path = chatbot_model.response_path or "reply"
        self.timeout = getattr(chatbot_model, "timeout_seconds", 20) or 20
        self.custom_headers = getattr(chatbot_model, "custom_headers", {}) or {}

    def _prepare_headers(self) -> dict:
        headers = {
            "User-Agent": "AITestBench-Assurance/1.0",
            "Accept": "application/json",
            **self.custom_headers,
        }
        secret = decrypt_secret(self.bot.encrypted_credentials)
        if secret:
            if self.auth_type == "BEARER":
                headers["Authorization"] = f"Bearer {secret}"
            elif self.auth_type == "API_KEY":
                headers["X-API-Key"] = secret
        return headers

    def _prepare_payload(self, message: str) -> dict:
        payload = {}
        for target, source in self.request_mapping.items():
            if source == "message":
                payload[target] = message
            else:
                payload[target] = source
        if not payload:
            payload = {"message": message}
        return payload

    async def connect(self) -> bool:
        test_res = await self.test_connection()
        return test_res.get("status") == "CONNECTED"

    async def test_connection(self) -> dict:
        validate_public_url(self.endpoint_url)
        start = time.perf_counter()
        try:
            answer, latency, raw = await self.send_message("TestBench Ping — Connection Test")
            return {
                "status": "CONNECTED",
                "http_status": 200,
                "latency_ms": latency,
                "extracted_response": answer[:500],
                "raw_response": raw,
            }
        except Exception as exc:
            latency = int((time.perf_counter() - start) * 1000)
            return {
                "status": "ERROR",
                "http_status": getattr(exc, "status_code", 502),
                "latency_ms": latency,
                "error_detail": str(exc),
            }

    async def send_message(self, message: str) -> Tuple[str, int, dict]:
        validate_public_url(self.endpoint_url)
        headers = self._prepare_headers()
        payload = self._prepare_payload(message)

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=False) as client:
            if self.http_method == "GET":
                resp = await client.get(self.endpoint_url, params=payload, headers=headers)
            else:
                resp = await client.request(self.http_method, self.endpoint_url, json=payload, headers=headers)
        
        latency = int((time.perf_counter() - start) * 1000)
        
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"Chatbot endpoint returned HTTP {resp.status_code}: {resp.text[:300]}"
            )

        try:
            data = resp.json()
        except Exception:
            data = {"response": resp.text}

        extracted = self.normalize_response(data)
        return extracted, latency, data

    async def send_conversation(self, turns: list[dict]) -> Tuple[str, int, dict]:
        # Extract the latest user turn
        last_user_turn = next(
            (t["content"] for t in reversed(turns) if t.get("role") == "user"),
            ""
        )
        return await self.send_message(last_user_turn)

    def normalize_response(self, raw_data: Any) -> str:
        if not self.response_path or self.response_path == ".":
            if isinstance(raw_data, str): return raw_data
            return json.dumps(raw_data)

        val = raw_data
        for part in self.response_path.split("."):
            if isinstance(val, dict) and part in val:
                val = val[part]
            elif isinstance(val, list) and part.isdigit() and int(part) < len(val):
                val = val[int(part)]
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Path segment '{part}' from response_path '{self.response_path}' not found in chatbot response."
                )
        return str(val) if not isinstance(val, str) else val
