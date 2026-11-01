# AI TestBench — Production Deployment Guide: Render & Vercel

This guide provides step-by-step instructions for deploying **AI TestBench** to production using:
- **Render**: Hosts the FastAPI Python Backend (`ai-testbench-backend.onrender.com`)
- **Vercel**: Hosts the Next.js 14 Frontend (`ai-testbench.vercel.app`)

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │             End User                 │
                      └──────────────────┬───────────────────┘
                                         │ (HTTPS)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          Vercel Deployment           │
                      │       Next.js 14 SaaS Frontend       │
                      │   (https://ai-testbench.vercel.app)  │
                      └──────────────────┬───────────────────┘
                                         │ API Requests (REST / JSON)
                                         │ NEXT_PUBLIC_API_URL
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          Render Deployment           │
                      │          FastAPI Backend             │
                      │(https://ai-testbench.onrender.com/api)│
                      └──────────┬─────────────────┬─────────┘
                                 │                 │
                 Database Storage│                 │REST HTTPX (SSRF-Protected)
                                 ▼                 ▼
             ┌─────────────────────────┐     ┌────────────────────────┐
             │ SQLite Persistent Disk  │     │ Target AI Chatbots /   │
             │ or Render Managed PG    │     │ Customer Endpoints     │
             └─────────────────────────┘     └────────────────────────┘
```

---

## Phase 1: Git Repository Preparation

To deploy to both Render and Vercel, push the codebase to a GitHub or GitLab repository.

### Step 1: Initialize Git and Commit
Open PowerShell in the workspace root:

```powershell
cd D:\AI

# 1. Initialize git
git init -b main

# 2. Stage all project files (ignoring .venv, .env, node_modules)
git add .

# 3. Create initial commit
git commit -m "feat: complete AI TestBench platform with Render and Vercel deployment assets"
```

### Step 2: Push to GitHub
Create a new repository on GitHub (e.g., `ai-testbench`), then run:

```powershell
git remote add origin https://github.com/<your-username>/ai-testbench.git
git push -u origin main
```

---

## Phase 2: Deploying the Backend on Render

Deploy the backend first so you have its live URL for the frontend.

### Option A: 1-Click Blueprint (Recommended)
AI TestBench includes a pre-configured `render.yaml` Blueprint:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Select your `ai-testbench` repository.
4. Render automatically reads `render.yaml` and provisions:
   - **Service Name**: `ai-testbench-backend`
   - **Environment**: Python 3.10+
   - **Root Directory**: `TestBench-main`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Persistent Disk**: 1 GB disk mounted at `/var/data`
   - **Auto-generated Secrets**: `CREDENTIAL_ENCRYPTION_KEY`
5. Click **Apply**.
6. Once deployed, Render provides your live backend URL:
   `https://ai-testbench-backend.onrender.com`

---

### Option B: Manual Web Service Setup
If you prefer configuring via the Render UI:

1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `ai-testbench-backend`
   - **Region**: Oregon (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: `TestBench-main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free or Starter
4. Under **Advanced** → **Environment Variables**, add:

| Key | Recommended Value | Purpose |
|---|---|---|
| `PYTHON_VERSION` | `3.10.11` | Python runtime version |
| `APP_ENV` | `production` | Production mode |
| `ALLOW_PRIVATE_CHATBOT_HOSTS` | `false` | Blocks SSRF attacks to internal networks |
| `CREDENTIAL_ENCRYPTION_KEY` | *(Generate via script below)* | AES-128 key for encrypting chatbot credentials |
| `CORS_ORIGINS` | `https://*.vercel.app,http://localhost:3000` | Whitelists Vercel frontend |
| `DATABASE_URL` | `sqlite:////var/data/testbench.db` | SQLite location (or PostgreSQL connection string) |
| `DEFAULT_LLM_PROVIDER` | `deterministic_mock` | Offline engine (or `gemini`, `groq`, `openai`) |

*Generate a Fernet encryption key using:*
```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

5. (Optional) Under **Disks**, add:
   - **Name**: `testbench-disk`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB
6. Click **Create Web Service**.

### Step 3: Verify Backend Health
Once the build completes, test the health endpoint in your browser:
- `https://ai-testbench-backend.onrender.com/health` → `{"status": "healthy", "service": "AI TestBench"}`
- `https://ai-testbench-backend.onrender.com/docs` → Interactive Swagger UI documentation.

---

## Phase 3: Deploying the Frontend on Vercel

### Option A: Vercel Dashboard (Recommended)

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New…** → **Project**.
3. Select your GitHub repository (`ai-testbench`) and click **Import**.
4. In the Project Configuration:
   - **Project Name**: `ai-testbench`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`.
5. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ai-testbench-backend.onrender.com/api/v1` |

*(Replace with your actual Render URL from Phase 2, including `/api/v1`)*

6. Click **Deploy**.
7. In ~60 seconds, Vercel will complete the build and assign your production URL:
   `https://ai-testbench.vercel.app`

---

### Option B: Deploying via Vercel CLI
If you prefer deploying via terminal:

1. Open PowerShell and log in:
   ```powershell
   cd D:\AI\frontend
   vercel login
   ```
2. Link and deploy to production:
   ```powershell
   vercel --prod --build-env NEXT_PUBLIC_API_URL="https://ai-testbench-backend.onrender.com/api/v1"
   ```

---

## Phase 4: Post-Deployment Verification

1. **Open Frontend**: Navigate to your Vercel URL (e.g. `https://ai-testbench.vercel.app`).
2. **Dashboard**: Confirm the KPIs, pass rate card, and coverage widget load cleanly without errors.
3. **Create Project**: Go to **Projects** → **New Project**, create `"Production Assurance"`.
4. **Compile Contract**: Go to **Contracts** → enter a natural language rule (e.g. *"Refunds must be requested within 30 days"*), compile, review, and approve.
5. **Generate Scenarios**: Generate test scenarios and toggle approval.
6. **Execute**: Run evaluations and observe real-time latency and status updates.

---

## Production Security Hardening Checklist

- [x] **SSRF Guard**: `ALLOW_PRIVATE_CHATBOT_HOSTS=false` ensures outgoing chatbot calls cannot probe cloud metadata (`169.254.169.254`) or VPC internal IPs.
- [x] **Credential Isolation**: Chatbot API keys and tokens are encrypted at rest with Fernet AES-128 and never returned in API payloads.
- [x] **CORS Locking**: In Render environment variables, update `CORS_ORIGINS` to your exact Vercel production domain (e.g., `https://ai-testbench.vercel.app`).
- [x] **Render Database Scale-Up**: For high concurrency or multi-region scaling, attach a **Render Managed PostgreSQL** database by setting `DATABASE_URL` to Render's internal PostgreSQL connection string.
