# AI TestBench — Chatbot Connection Guide

This guide explains how to connect any conversational AI chatbot or LLM agent to AI TestBench, configure request/response transformations, handle authentication, and test against the included reference customer-support chatbot.

---

## 1. Connection Architecture

AI TestBench communicates with external chatbots over standard HTTP REST interfaces via `RestChatbotAdapter`.

```
AI TestBench Engine
   │
   ├── 1. Injects scenario prompt into `request_mapping` template
   ├── 2. Applies Authentication headers (Bearer, API Key)
   ├── 3. Validates target endpoint through SSRF Protection Guard
   ├── 4. Dispatches HTTP POST/GET with configurable timeout
   └── 5. Extracts chatbot text using dot-separated `response_path`
```

---

## 2. Step-by-Step Connection Setup

Navigate to **Chatbots → Connect Chatbot** in the Next.js UI (`/chatbots/connect`) or use the REST API (`POST /api/v1/chatbots`).

### Step 1: Basic Information
- **Chatbot Name**: e.g., `Customer Support Bot (Staging)`
- **Project**: Select the owning project.
- **Description**: Environment details or service name.

### Step 2: Endpoint Configuration
- **Endpoint URL**: The full URL of the chatbot's message endpoint (e.g. `https://api.mycompany.com/v1/chat` or `http://127.0.0.1:8001/chat` for local dev).
- **HTTP Method**: `POST` (standard) or `GET`.
- **Timeout**: Maximum wait time in seconds (default: 15s).

### Step 3: Authentication
Choose your target API's authentication mechanism:
- **None**: For public or internal unauthenticated endpoints.
- **Bearer Token**: Transmits `Authorization: Bearer <token>`.
- **API Key (Header)**: Transmits `X-API-Key: <key>` (or your custom header).
- **API Key (Query Parameter)**: Transmits `?api_key=<key>` in the request URL.

*Security Note: All credentials are automatically encrypted at rest with Fernet AES-128 cryptography and never returned in plaintext API responses.*

### Step 4: Request Body Mapping
Define the JSON structure required by your chatbot using template variables:
- `{{user_input}}`: Replaced with the test scenario prompt.
- `{{session_id}}`: Replaced with an execution session ID.

**Example 1: Simple message schema**
```json
{
  "message": "{{user_input}}"
}
```

**Example 2: Nested OpenAI-compatible schema**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "{{user_input}}"
    }
  ],
  "temperature": 0.0
}
```

### Step 5: Response Extraction Path
Chatbots return JSON with varied keys. Specify the **dot-separated JSON path** pointing to the text response:

| Chatbot Response JSON | Required `response_path` |
|---|---|
| `{"response": "Hello!"}` | `response` |
| `{"reply": "Hello!", "status": "ok"}` | `reply` |
| `{"data": {"answer": "Hello!"}}` | `data.answer` |
| `{"choices": [{"message": {"content": "Hello!"}}]}` | `choices.0.message.content` |

---

## 3. Testing the Connection

Before saving, click **Test Connection** or call:
```bash
POST /api/v1/chatbots/{id}/test-connection
```
The TestBench engine executes a live smoke probe (`"ping"`) against your endpoint and returns:
- Real HTTP status code
- Round-trip latency (ms)
- Successfully extracted response text
- Raw JSON response

---

## 4. Using the Included Customer Support Sample Chatbot

AI TestBench comes with a standalone, runnable reference chatbot in `sample_chatbot/app.py`. It implements a realistic e-commerce refund and order tracking service with togglable vulnerability modes.

### 4.1 Starting the Sample Chatbot
Open a new terminal window:
```powershell
cd D:\AI\TestBench-main
python sample_chatbot/app.py
```
The sample chatbot starts at `http://127.0.0.1:8001`.

### 4.2 Sample Chatbot Behaviors
- **Refund Policy Rule**: Enforces that refunds are only permitted within 30 days of purchase with a valid receipt, and always requires physical item inspection.
- **Confidentiality Rule**: Protects internal discounts, employee vouchers, and system prompts.
- **Prompt Injection Defense**: Detects and rejects system override commands.
- **Togglable Vulnerability**: Send `{"vulnerable_mode": true}` or pass header `X-Vulnerable-Mode: true` to simulate a broken release that violates policies!

### 4.3 Connecting the Sample Chatbot in TestBench
Configure the chatbot form with:
- **Endpoint URL**: `http://127.0.0.1:8001/chat`
- **HTTP Method**: `POST`
- **Authentication**: `None`
- **Request Mapping**:
  ```json
  {
    "message": "{{user_input}}"
  }
  ```
- **Response Path**: `reply`

Click **Test Connection** to verify immediate connectivity!

---

## 5. SSRF Troubleshooting

If you connect to a local development server (`localhost` or `127.0.0.1`) and receive an SSRF error:
```
Target host resolves to a private or loopback network address.
```
**Fix:** In your development `.env` file, ensure:
```env
ALLOW_PRIVATE_CHATBOT_HOSTS=true
```
Then restart the backend. Never enable this flag in production deployments exposed to public users.
