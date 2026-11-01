import base64, hashlib, ipaddress, socket
from urllib.parse import urlparse
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from app.core.config import settings

def _fernet():
    raw=settings.credential_encryption_key
    key=raw.encode() if raw else base64.urlsafe_b64encode(hashlib.sha256(b"ai-testbench-local-development-key-change-me").digest())
    try: return Fernet(key)
    except Exception as exc: raise RuntimeError("CREDENTIAL_ENCRYPTION_KEY must be a valid Fernet key") from exc

def encrypt_secret(value: str | None): return _fernet().encrypt(value.encode()).decode() if value else None
def decrypt_secret(value: str | None):
    if not value: return None
    try: return _fernet().decrypt(value.encode()).decode()
    except InvalidToken as exc: raise RuntimeError("Unable to decrypt chatbot credential; check encryption key") from exc

def validate_public_url(url: str):
    parsed=urlparse(url)
    if parsed.scheme not in {"http","https"} or not parsed.hostname: raise HTTPException(422,"Only valid HTTP(S) endpoint URLs are supported")
    if settings.allow_private_chatbot_hosts: return
    try: addresses=socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme=="https" else 80), type=socket.SOCK_STREAM)
    except socket.gaierror: raise HTTPException(422,"Chatbot hostname could not be resolved")
    for item in addresses:
        ip=ipaddress.ip_address(item[4][0])
        if not ip.is_global: raise HTTPException(422,"Private and loopback addresses (localhost, 127.0.0.1) cannot be reached from cloud deployments. Please use a public URL or the built-in sample chatbot at: https://ai-testbench.onrender.com/api/v1/sample-chatbot/chat")
