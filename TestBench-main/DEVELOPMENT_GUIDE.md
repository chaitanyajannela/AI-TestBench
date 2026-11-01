# AI TestBench — Developer & Contributor Guide

This guide describes how to configure your local development environment, run database migrations, execute tests, and extend the AI TestBench platform.

---

## 1. Prerequisites

- **Python**: Version 3.10 or higher (Python 3.10–3.12 supported)
- **Node.js**: Version 18.17+ or 20+ (with npm 9+)
- **Git**: Version 2.30+
- **Virtual Environment**: `venv` or `uv`

---

## 2. Local Environment Setup

### 2.1 Backend Setup (FastAPI)

1. Clone or navigate to the repository:
   ```powershell
   cd D:\AI\TestBench-main
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Upgrade pip and install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```
   *For local testing against local chatbots on localhost, verify `ALLOW_PRIVATE_CHATBOT_HOSTS=true`.*

5. Run database migrations:
   ```powershell
   alembic upgrade head
   ```

6. Start the FastAPI backend server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Open `http://127.0.0.1:8000/docs` to view the interactive OpenAPI documentation.

---

### 2.2 Frontend Setup (Next.js 14)

1. Navigate to the frontend directory:
   ```powershell
   cd D:\AI\frontend
   ```

2. Install Node.js dependencies:
   ```powershell
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file (optional, defaults to `http://127.0.0.1:8000/api/v1`):
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   ```

4. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. Verify a production build anytime:
   ```powershell
   npm run build
   ```

---

### 2.3 Running the Sample Chatbot

To run realistic end-to-end tests against a live conversational service:
```powershell
cd D:\AI\TestBench-main
python sample_chatbot/app.py
```
The sample chatbot runs on port 8001 (`http://127.0.0.1:8001/chat`).

---

## 3. Database Migrations (Alembic)

The database schema is managed via Alembic and supports both SQLite (local development) and PostgreSQL (production).

### Applying Migrations
```powershell
alembic upgrade head
```

### Creating a New Migration
When modifying `app/models.py`:
```powershell
alembic revision --autogenerate -m "Add new column or table"
```
Review the generated file in `alembic/versions/` and apply it with `alembic upgrade head`.

---

## 4. Coding Conventions & Standards

- **Python**: Follow PEP 8 style guidelines. Enforce strict type annotations using Python typing (`Optional`, `List`, `Dict`, `Union`).
- **Pydantic**: Use Pydantic v2 schemas (`model_config = ConfigDict(from_attributes=True)`).
- **SQLAlchemy**: Use modern SQLAlchemy 2.0 declarative syntax (`Mapped`, `mapped_column`, `relationship`).
- **Async vs Sync**: Core CPU-bound evaluations, deterministic parsing, and database transactions execute synchronously or via clean async service abstractions where appropriate. Network adapters use `httpx.AsyncClient` or `httpx.Client` with explicit timeouts.
- **TypeScript**: Strict mode enabled. Avoid `any` types; define reusable interfaces in dedicated component files or `src/lib/api.ts`.
- **CSS / Styling**: Tailwind CSS utility classes using the enterprise dark navy palette (`#090D16`, `#0D1526`, `#16223B`).

---

## 5. Adding a New LLM Provider

To add a new LLM provider (e.g. Mistral, Anthropic Claude native API):
1. Create `app/llm/mistral_provider.py` subclassing `LLMProvider`:
   ```python
   from app.llm.base import LLMProvider

   class MistralProvider(LLMProvider):
       def __init__(self, api_key: str, model: str = "mistral-large-latest"):
           self.api_key = api_key
           self.model = model

       def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.0) -> str:
           # Call Mistral API
           ...

       def is_available(self) -> bool:
           return bool(self.api_key)
   ```
2. Register the provider in `app/llm/factory.py`:
   ```python
   elif provider_name == "mistral":
       return MistralProvider(api_key=settings.mistral_api_key, model=settings.mistral_model)
   ```
3. Add configuration keys to `app/config.py`.
