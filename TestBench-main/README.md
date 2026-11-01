# AI TestBench — Behavior-First AI Assurance Platform

> **Define behavior. Discover weaknesses. Validate AI.**

AI TestBench is a production-oriented platform that allows engineering teams to connect their conversational AI chatbots, compile natural-language requirements into formal behavior contracts, automatically generate rigorous test scenarios, execute evaluations across multiple LLM reasoning engines, discover behavioral regressions, run mutation testing, and enforce release safety gates.

Traditional software testing verifies whether an application produces exact outputs. **AI TestBench evaluates whether AI applications consistently behave according to their intended behavioral contracts and safety constraints.**

---

## 1. Core Workflow Pipeline

Every module in AI TestBench contributes to an end-to-end assurance lifecycle:

```
CREATE PROJECT
      ↓
CONNECT CHATBOT (REST API + SSRF Guard + Credentials)
      ↓
DEFINE BEHAVIOR REQUIREMENTS (Natural Language)
      ↓
COMPILE BEHAVIOR CONTRACTS (Given-When-Then Clauses & Invariants)
      ↓
HUMAN APPROVES CONTRACTS (Human-in-the-Loop Governance)
      ↓
GENERATE TEST SCENARIOS (Boundary, Adversarial, Positive)
      ↓
HUMAN APPROVES TESTS (Review & Audit Gate)
      ↓
EXECUTE TEST SUITE (Live REST Probes or Batch Runs)
      ↓
EVALUATE RESPONSES (Hybrid Rule-Based + DeepEval LLM Judge)
      ↓
ANALYZE BEHAVIORAL COVERAGE (Category, Severity & Gap Analysis)
      ↓
DETECT REGRESSIONS (Baseline Version Diffing)
      ↓
PERFORM MUTATION TESTING (Automated Mutation Runner & Kill Score)
      ↓
ASSESS RELEASE RISK (Deterministic Multi-Factor Gating)
      ↓
APPROVE OR BLOCK RELEASE
```

---

## 2. Platform Modules (0–9)

| Module | Responsibility | Key Features |
|---|---|---|
| **Module 0: Foundation & System Config** | System base, configuration, logging, database | FastAPI, SQLite (Dev) / PostgreSQL (Prod), Alembic migrations, CORS, Structured Logging |
| **Module 1: Project & Chatbot Manager** | Manage projects and target chatbot connections | 7-step connection wizard, SSRF validation, Fernet encryption at rest, dot-path extraction, live smoke test |
| **Module 2: Prompt & Version Manager** | Chatbot versioning and prompt configuration | Immutable prompt versions, metadata tracking (temp, max tokens), side-by-side prompt diffing |
| **Module 3: Behavior Contract Intelligence** | Turn specifications into formal contracts | Requirement compiler, Given-When-Then clauses, forbidden invariants, human approval workflow |
| **Module 4: Scenario Generation & Suites** | Systematic test scenario creation | Boundary, adversarial, and positive scenario generation, approval toggles, reusable test suites |
| **Module 5: Execution & Evaluation Engine** | Live test execution and response evaluation | Live REST chatbot adapter, hybrid rule-based matching, DeepEval LLM judge, execution latency & logs |
| **Module 6: Behavioral Coverage Analysis** | Quantify contract coverage and identify gaps | Multi-dimensional coverage by risk category & severity, automated gap detection and test suggestions |
| **Module 7: Regression Detection & Drift** | Compare candidate chatbot against baseline | Golden baseline snapshots, automated drift detection, regression classification, response diffs |
| **Module 8: Behavioral Mutation Testing** | Measure test suite vigilance | Automated semantic requirement mutations, execution against mutated contracts, test suite Kill Score |
| **Module 9: Release Risk Assessment** | Deterministic deployment decision gates | Weighted risk scoring, zero-tolerance critical gates, explicit blockers list, audit trail |

---

## 3. Technology Stack

### Backend
- **Python 3.10+** (Python 3.10–3.12 supported)
- **FastAPI**: Asynchronous high-performance REST API
- **Pydantic v2**: Type validation and schema serialization
- **SQLAlchemy 2.0**: Modern declarative ORM
- **Alembic**: Database migrations
- **HTTPX**: Async/Sync HTTP client for target chatbot communication
- **Cryptography (Fernet)**: AES-128 secret encryption at rest
- **Pytest**: Automated unit, integration, and platform testing

### Frontend
- **Next.js 14** (App Router, Server & Client Components)
- **TypeScript**: Strict type safety
- **Tailwind CSS**: Enterprise Dark Navy styling (`#090D16`, `#0D1526`, `#16223B`)
- **Lucide React**: Vector icons
- **TanStack React Query / Context**: Reactive state management

### AI & LLM Providers (Modular Abstraction)
- **Google Gemini**: Native REST integration (`gemini-1.5-pro`, `gemini-1.5-flash`)
- **Groq**: Ultra-fast inference (`llama-3.3-70b-versatile`)
- **OpenRouter**: Unified open-source and commercial model routing
- **OpenAI**: Compatible with `gpt-4o`, `gpt-4o-mini`, vLLM, and local Ollama
- **Deterministic Mock Provider**: Offline rule-based engine for zero-dependency testing without API keys

### Testing & Observability Ecosystem
- **Promptfoo**: CI/CD export generator with standalone YAML & Python provider
- **DeepEval**: LLM-as-a-judge for semantic faithfulness and qualitative scoring
- **Giskard**: Automated adversarial security and vulnerability scanning
- **Langfuse**: Observability tracing for latency, cost, and token metrics

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- Python 3.10+ installed
- Node.js 18.17+ or 20+ installed

### 4.2 Step 1: Start the Backend Server
```powershell
cd D:\AI\TestBench-main
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 4.3 Step 2: Start the Sample Customer Support Chatbot
In a separate terminal:
```powershell
cd D:\AI\TestBench-main
python sample_chatbot/app.py
```
Sample Chatbot starts on `http://127.0.0.1:8001/chat`.

### 4.4 Step 3: Start the Next.js Frontend
In a separate terminal:
```powershell
cd D:\AI\frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 5. Sample Chatbot Walkthrough

AI TestBench includes a realistic customer-support reference chatbot (`sample_chatbot/app.py`).

### Compliant vs. Vulnerable Modes:
1. **Compliant Mode (Default)**:
   - Enforces refund eligibility strictly within 30 days with a valid receipt.
   - Refuses to guarantee refunds prior to physical item inspection.
   - Protects confidential employee codes and internal credentials.
   - Resists adversarial prompt injections.
2. **Vulnerable Mode**:
   - Send `{"vulnerable_mode": true}` or header `X-Vulnerable-Mode: true`.
   - The chatbot exhibits behavioral regressions: promises instant refunds, leaks internal codes, and succumbs to jailbreaks.
   - **Use this to demonstrate regression detection, mutation kill scores, and release blocking in real time!**

---

## 6. Running Automated Tests

AI TestBench includes comprehensive automated tests covering all 9 modules:

```powershell
cd D:\AI\TestBench-main
pytest -v
```

Output:
```
tests/test_platform.py::test_full_platform_workflow PASSED
tests/test_platform.py::test_contract_lifecycle PASSED
tests/test_platform.py::test_scenario_execution_with_manual_response PASSED
tests/test_platform.py::test_coverage_calculation PASSED
tests/test_platform.py::test_release_assessment_blocks_on_critical_failure PASSED
tests/test_integrations.py::test_integrations_status PASSED
tests/test_integrations.py::test_promptfoo_export PASSED
tests/test_integrations.py::test_deepeval_evaluate PASSED
tests/test_integrations.py::test_giskard_scan PASSED
tests/test_integrations.py::test_langfuse_record PASSED
tests/test_sample_chatbot.py::test_sample_chatbot_normal_response PASSED
tests/test_sample_chatbot.py::test_sample_chatbot_confidentiality_protection PASSED
tests/test_sample_chatbot.py::test_sample_chatbot_prompt_injection_rejection PASSED
tests/test_enhanced_platform.py::test_llm_factory_and_mock_provider PASSED
tests/test_enhanced_platform.py::test_prompt_version_management_and_diff PASSED
tests/test_enhanced_platform.py::test_test_suite_batch_execution PASSED
tests/test_enhanced_platform.py::test_regression_detection PASSED
tests/test_enhanced_platform.py::test_automated_mutation_runner PASSED

======================== 18 passed in 2.38s ========================
```

---

## 7. Complete Documentation Suite

Detailed architecture and operations guides are available in the repository:

- 📘 [System Architecture & Design (ARCHITECTURE.md)](ARCHITECTURE.md)
- 📗 [REST API Reference & Curl Examples (API_DOCUMENTATION.md)](API_DOCUMENTATION.md)
- 📙 [Testing Tools & LLM Ecosystem (INTEGRATION_GUIDE.md)](INTEGRATION_GUIDE.md)
- 📕 [Chatbot Connection & Sample Bot Guide (CHATBOT_CONNECTION_GUIDE.md)](CHATBOT_CONNECTION_GUIDE.md)
- 📓 [Developer Setup & Contributing (DEVELOPMENT_GUIDE.md)](DEVELOPMENT_GUIDE.md)
- 🔬 [Quality Assurance & Mutation Testing (TESTING_GUIDE.md)](TESTING_GUIDE.md)
- 🔒 [Security & Threat Model (SECURITY.md)](SECURITY.md)

---

## 8. License

AI TestBench is released under the Apache 2.0 License.
