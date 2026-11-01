# AI TestBench — System Architecture & Design Specification

AI TestBench is a behavior-first AI assurance and release readiness platform designed to evaluate AI chatbots, conversational agents, and LLM applications against rigorous, human-approved behavioral contracts.

---

## 1. High-Level System Architecture

AI TestBench adopts a **modular monolith** design pattern on the backend and a reactive Next.js 14 Single-Page Application on the frontend. The deterministic evaluation core coordinates test orchestration, while modular adapters interface with external LLM reasoning engines, REST chatbots, and observability ecosystems.

```mermaid
flowchart TD
    subgraph UI ["Frontend (Next.js 14 / TypeScript / Tailwind CSS)"]
        Dashboard["Dashboard & Metrics"]
        ChatbotMgr["Chatbot Connection Wizard"]
        ContractInt["Contract Compiler & Review"]
        ScenarioMgr["Scenario Catalog & Approver"]
        SuiteRunner["Suite Batch Runner"]
        CoverageView["Behavioral Coverage Matrix"]
        RegressView["Regression Baseline Diff"]
        MutationView["Mutation Kill-Score Lab"]
        ReleaseGate["Release Risk Gate"]
    end

    subgraph API ["FastAPI Backend (Python 3.10+)"]
        Router["API Gateway / Routing (/api/v1)"]
        AuthMiddleware["CORS, SSRF Guard, Credential Decryptor"]
        
        subgraph CoreEngine ["Deterministic Core Engine (Services)"]
            CompilerService["Requirement Compiler"]
            ApprovalService["Approval Workflow Engine"]
            ScenarioService["Scenario Generator"]
            EvalService["Hybrid Evaluator (Rule + LLM Judge)"]
            CoverageService["Coverage & Gap Analyzer"]
            RegressionService["Baseline & Drift Detector"]
            MutationService["Automated Mutation Runner"]
            ReleaseService["Release Gate & Risk Calculator"]
        end

        subgraph Adapters ["Modular Adapters & Providers"]
            ChatbotAdapter["RestChatbotAdapter (SSRF-Safe HTTPX)"]
            LLMFactory["LLM Provider Factory"]
            Gemini["Google Gemini Adapter"]
            Groq["Groq & OpenRouter Adapter"]
            OpenAI["OpenAI-Compatible Adapter"]
            DeterministicMock["Offline Mock Engine"]
        end

        subgraph Ecosystem ["Testing & Observability Adapters"]
            PromptfooAdapter["Promptfoo CI/CD Exporter"]
            DeepEvalAdapter["DeepEval GEval Wrapper"]
            GiskardAdapter["Giskard Scanner Adapter"]
            LangfuseAdapter["Langfuse Tracing Adapter"]
        end
    end

    subgraph Persistence ["Persistence Layer"]
        SQLAlchemy["SQLAlchemy 2.x ORM"]
        Alembic["Alembic Migrations"]
        Database[("SQLite (Dev) / PostgreSQL (Prod)")]
        FernetStore["Fernet Encrypted Credentials"]
    end

    subgraph Target ["Target Applications"]
        CustomerChatbot["Target AI Chatbot (Sample / Customer REST)"]
    end

    UI -->|REST / JSON| Router
    Router --> AuthMiddleware
    AuthMiddleware --> CoreEngine
    CoreEngine --> SQLAlchemy
    SQLAlchemy --> Database
    CoreEngine --> Adapters
    CoreEngine --> Ecosystem
    ChatbotAdapter --> Target
    LLMFactory --> Gemini & Groq & OpenAI & DeterministicMock
```

---

## 2. Modular Monolith Architecture

The backend repository is organized into distinct functional domains, maintaining clear boundaries and loose coupling.

```
TestBench-main/
├── alembic/                      # Database migration scripts & environment
│   └── versions/                 # Versioned migration histories
├── app/
│   ├── adapters/                 # Target system communication adapters
│   │   ├── __init__.py
│   │   └── chatbot_adapter.py    # RestChatbotAdapter with SSRF protection
│   ├── api/                      # Presentation layer / REST endpoints
│   │   ├── __init__.py
│   │   └── routes.py             # FastAPI routes for all modules
│   ├── integrations/             # Third-party testing & observability tools
│   │   ├── __init__.py
│   │   ├── availability.py       # Integration registry matrix
│   │   ├── deepeval_integration.py
│   │   ├── giskard_integration.py
│   │   ├── langfuse_integration.py
│   │   └── promptfoo_integration.py
│   ├── llm/                      # Multi-provider LLM abstraction
│   │   ├── __init__.py
│   │   ├── base.py               # Abstract LLMProvider base class
│   │   ├── factory.py            # Dynamic provider instantiation
│   │   ├── gemini_provider.py    # Google Gemini REST integration
│   │   ├── groq_provider.py      # Groq / OpenRouter integration
│   │   ├── openai_provider.py    # OpenAI compatible integration
│   │   └── deterministic_mock_provider.py # Zero-dependency offline engine
│   ├── config.py                 # Pydantic v2 application settings
│   ├── database.py               # SQLAlchemy engine & session factory
│   ├── main.py                   # FastAPI entrypoint, middleware, CORS
│   ├── models.py                 # SQLAlchemy 2.0 ORM relational models
│   ├── schemas.py                # Pydantic v2 request/response schemas
│   ├── security.py               # Fernet encryption & SSRF validation
│   └── services.py               # Core business logic & deterministic algorithms
├── sample_chatbot/               # Real target customer-support chatbot
│   ├── app.py                    # Standalone FastAPI sample server
│   └── README.md
├── tests/                        # Automated unit, integration, and e2e tests
│   ├── test_enhanced_platform.py
│   ├── test_integrations.py
│   ├── test_platform.py
│   └── test_sample_chatbot.py
├── alembic.ini                   # Alembic configuration
├── requirements.txt              # Production backend dependencies
└── requirements-integrations.txt # Optional data science & evaluation tools
```

---

## 3. Core Traceability Pipeline

A central requirement of AI TestBench is end-to-end traceability. Every release decision is mathematically grounded in execution logs that link back to human-approved behavior contracts.

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as QA / AI Engineer
    participant UI as Next.js Dashboard
    participant API as FastAPI Backend
    participant LLM as LLM Intelligence Engine
    participant Target as Target Chatbot API
    participant DB as Relational Database

    Engineer->>UI: Input Natural Language Requirement
    UI->>API: POST /api/v1/requirements/compile
    API->>LLM: Parse into Behavioral Clauses (Given-When-Then)
    LLM-->>API: Structured Clauses, Invariants & Risk Class
    API->>DB: Store BehaviorContract (Status: DRAFT)
    API-->>UI: Contract Draft Preview

    Engineer->>UI: Review & Approve Contract
    UI->>API: PATCH /api/v1/contracts/{id}/approve
    API->>DB: Update Status: APPROVED, Record Approver

    Engineer->>UI: Generate Scenarios
    UI->>API: POST /api/v1/test-scenarios/generate/{contract_id}
    API->>LLM: Generate Boundary, Adversarial, Happy Path Scenarios
    LLM-->>API: Concrete Input Prompts & Evaluation Rules
    API->>DB: Store TestScenarios (Status: DRAFT)

    Engineer->>UI: Approve Scenarios
    UI->>API: PATCH /api/v1/test-scenarios/{id}/approval
    API->>DB: Update is_approved = True

    Engineer->>UI: Execute Scenario or Suite
    UI->>API: POST /api/v1/test-scenarios/{id}/execute
    API->>Target: POST Request Body (SSRF-Checked, Headers Injected)
    Target-->>API: HTTP Response Body
    API->>API: Extract Response via Dot-Path (e.g. data.reply)
    API->>API: Hybrid Evaluation (Rule-Based + DeepEval Judge)
    API->>DB: Store TestExecution (Verdict: PASSED/FAILED, Latency, Log)
    API-->>UI: Real-time Execution Result & Diff

    Engineer->>UI: Assess Release
    UI->>API: POST /api/v1/releases/assess
    API->>DB: Fetch Executions, Baselines, Coverage, Mutations
    API->>API: Evaluate Release Gates (Coverage %, Critical Passes, Mutation Score)
    API->>DB: Store ReleaseAssessment (DECISION: APPROVED / BLOCKED)
    API-->>UI: Gate Breakdown, Blockers, Audit Trail
```

---

## 4. Multi-Provider LLM Integration Architecture

AI TestBench does not lock developers into a single LLM vendor. The LLM abstraction layer provides a unified interface:

```python
class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.0) -> str:
        """Execute text generation against the configured provider."""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check provider operational status and API key readiness."""
        pass
```

### Provider Matrix:
1. **Google Gemini**: Uses native REST endpoints against `gemini-1.5-pro` and `gemini-1.5-flash` with direct JSON parsing.
2. **Groq**: Uses Groq's high-speed inference endpoints (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`).
3. **OpenRouter**: Accesses unified open-source and commercial foundation models over OpenAI-compatible endpoints.
4. **OpenAI**: Connects to `gpt-4o`, `gpt-4o-mini`, or any internal OpenAI-compatible gateway (vLLM, Ollama, LocalAI).
5. **Deterministic Mock Engine**: Zero-configuration offline intelligence engine with semantic rule-based heuristics that guarantees 100% test reproducibility without external API keys or cloud dependencies.

---

## 5. Security Architecture

### 5.1 SSRF (Server-Side Request Forgery) Guard
When communicating with user-configured chatbots, AI TestBench enforces strict network boundary protections:
- **Protocol Whitelisting**: Only `http://` and `https://` schemes are accepted.
- **DNS Resolution & IP Inspection**: Resolves hostnames to IP addresses prior to request dispatch.
- **Private & Loopback Blocking**: Automatically blocks IPv4 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback addresses (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), and carrier-grade NAT (`100.64.0.0/10`).
- **Cloud Metadata Protection**: Explicitly blocks `169.254.169.254` (AWS/GCP/Azure metadata endpoints).
- **Development Flag**: `ALLOW_PRIVATE_CHATBOT_HOSTS=true` allows trusted local testing (e.g. testing against `http://localhost:8001`) during development only.

### 5.2 Secret Encryption at Rest
- Sensitive credentials (API keys, Bearer tokens) are encrypted before writing to SQLite or PostgreSQL using **Fernet symmetric cryptography** (AES-128-CBC with SHA256 HMAC).
- When retrieving chatbot records via API endpoints, credentials are never returned in plaintext. The API returns `has_credential: true` and masks values to prevent credential harvesting.

---

## 6. Release Assessment & Gating Engine

Release risk is computed deterministically rather than delegated to probabilistic LLM judgment:

$$\text{Release Ready} = (\text{Coverage} \ge \tau_{\text{cov}}) \land (\text{Pass Rate} \ge \tau_{\text{pass}}) \land (\text{Critical Failures} = 0) \land (\text{Regressions} = 0) \land (\text{Mutation Score} \ge \tau_{\text{mut}})$$

Where default production thresholds are:
- Minimum Behavioral Coverage: **80.0%**
- Minimum Test Pass Rate: **90.0%**
- Allowed Critical Failures: **0**
- Allowed Regressions: **0**
- Minimum Mutation Kill Score: **70.0%**
