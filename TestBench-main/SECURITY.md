# AI TestBench — Security Architecture & Threat Model

AI TestBench connects to external systems, executes user-defined webhooks and chatbot requests, handles credentials, and coordinates automated evaluation pipelines. Security is designed into every layer.

---

## 1. Threat Model & Mitigations

| Threat | Risk Level | Mitigation Strategy |
|---|---|---|
| **Server-Side Request Forgery (SSRF)** | Critical | Strict IP inspection, private subnet blocking, cloud metadata IP prohibition |
| **Credential Theft / Data Breach** | Critical | Symmetric Fernet AES-128 encryption at rest, response masking, zero secret logging |
| **Prompt Injection Attacks** | High | Dedicated adversarial scenario generation, red-teaming checks, Giskard scanner |
| **Model Hallucination / Drift** | High | Deterministic regression baseline comparison, multi-dimensional coverage metrics |
| **Accidental Bad Release** | Critical | Deterministic release gates with zero-tolerance for critical failures or regressions |

---

## 2. Server-Side Request Forgery (SSRF) Protection

When users register a chatbot, they provide an `endpoint_url`. Malicious actors could theoretically attempt to point this URL to internal cloud metadata services (`http://169.254.169.254/latest/meta-data/`) or private databases (`http://10.0.0.5:5432`).

### 2.1 Defense Implementation
The `validate_target_endpoint()` function in `app/security.py` enforces:
1. **Scheme Validation**: Only `http` and `https` schemes are permitted. File schemes (`file://`), FTP, gopher, and unix sockets are rejected immediately.
2. **DNS Resolution & Subnet Prohibitions**:
   - The hostname is resolved to its IP addresses.
   - Each IP is checked against standard blocked CIDR ranges:
     - `10.0.0.0/8` (Private Class A)
     - `172.16.0.0/12` (Private Class B)
     - `192.168.0.0/16` (Private Class C)
     - `127.0.0.0/8` and `::1` (Loopback addresses)
     - `169.254.0.0/16` (Link-local addresses)
     - `169.254.169.254` (Cloud Instance Metadata Service)
     - `100.64.0.0/10` (Shared address space)
     - `0.0.0.0/8` (Current network)
3. **Redirect Disabling**: HTTP requests are executed with `follow_redirects=False` to prevent open-redirect bypasses.
4. **Controlled Development Override**:
   For local development where the chatbot runs on `localhost` (e.g., port 8001), setting `ALLOW_PRIVATE_CHATBOT_HOSTS=true` in `.env` permits loopback access. **This setting must always be set to `false` in production environments.**

---

## 3. Credential Security & Encryption at Rest

### 3.1 Encryption at Rest (Fernet)
- When a chatbot is registered with an API key, Bearer token, or custom header, the credential is encrypted using **Fernet symmetric encryption** (`cryptography.fernet.Fernet`), which uses AES-128 in CBC mode with PKCS7 padding and HMAC-SHA256 authentication.
- The ciphertext is stored in the database.
- The encryption key is sourced from `CREDENTIAL_ENCRYPTION_KEY` in `.env`.
- If the key is not set, a development fallback is used with an explicit warning logged. Production deployments must generate a cryptographically strong 32-byte url-safe base64 key:
  ```python
  from cryptography.fernet import Fernet
  print(Fernet.generate_key().decode())
  ```

### 3.2 Secret Masking & Egress Protection
- API response serializers (`ChatbotResponse`) never output raw credentials.
- The API returns a boolean flag `has_credential: true` and a masked hint (e.g. `sk-****`).
- Structured application logs never output raw tokens or authorization headers.

---

## 4. Production Deployment Security Recommendations

1. **Reverse Proxy & TLS**: Always place the FastAPI application behind a production reverse proxy (e.g. Nginx, Cloudflare, AWS ALB) with TLS 1.3 enabled.
2. **CORS Hardening**: Configure `ALLOWED_ORIGINS` in `.env` to match only trusted frontend origins (e.g. `https://testbench.yourcompany.com`) rather than `*`.
3. **Network Isolation**: Run the backend in a restricted VPC subnet with egress filtering so that outgoing chatbot traffic passes through a secure NAT gateway or web proxy.
4. **Environment Secrets**: Store `CREDENTIAL_ENCRYPTION_KEY`, database connection strings, and LLM API keys in a managed secret store (e.g. AWS Secrets Manager, Google Secret Manager, HashiCorp Vault).
