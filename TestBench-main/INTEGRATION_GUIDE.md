# AI TestBench — External Testing & LLM Ecosystem Integration Guide

AI TestBench acts as the behavior-first orchestration and governance layer, augmenting its deterministic core with four prominent open-source and commercial evaluation and observability tools.

---

## 1. Tool Integration Overview

| Tool | Ecosystem Role | Execution Adapter | Configuration In TestBench |
|---|---|---|---|
| **Promptfoo** | External test runner, model benchmark, CI/CD export | Scenario export adapter (`/api/v1/integrations/promptfoo/export/{chatbot_id}`) | Built-in CLI generator; outputs zip package with `promptfooconfig.yaml` and Python provider |
| **DeepEval** | LLM-as-a-judge / qualitative evaluation metrics | `deepeval_integration.py` (`POST /api/v1/integrations/deepeval/evaluate/{scenario_id}`) | GEval / Faithfulness / Relevancy metrics using OpenAI or Gemini judge |
| **Giskard** | Automated adversarial vulnerability and security scan | `giskard_integration.py` (`POST /api/v1/integrations/giskard/scan/{chatbot_id}`) | Wraps Giskard's automated scanner for hallucinations, jailbreaks, and toxicity |
| **Langfuse** | LLM observability, trace monitoring, latency, cost tracking | `langfuse_integration.py` (Automatic trace recorder during test execution) | Native ingestion client hooks into `TestExecution` lifecycle |

---

## 2. Integrated Testing Tools Setup

### 2.1 Promptfoo Integration

Promptfoo allows running evaluations from the command line and integrating them into continuous deployment pipelines (GitHub Actions, GitLab CI).

#### How it works with AI TestBench:
1. AI TestBench maintains your human-approved behavior contracts and scenarios.
2. An engineer clicks **Export Promptfoo Config** or calls `POST /api/v1/integrations/promptfoo/export/{chatbot_id}`.
3. TestBench generates a standalone package:
   - `promptfooconfig.yaml`: Maps approved scenarios into Promptfoo test cases and assertions.
   - `testbench_provider.py`: A custom Promptfoo provider that dispatches prompts to your AI TestBench instance, ensuring that results appear simultaneously in Promptfoo and your centralized TestBench database.
4. Execute Promptfoo CLI:
   ```bash
   npx promptfoo@latest eval
   npx promptfoo@latest view
   ```

---

### 2.2 DeepEval Integration (LLM-as-a-Judge)

DeepEval provides semantic scoring, faithfulness, and answer relevancy metrics evaluated by an LLM judge.

#### Installation:
```bash
pip install deepeval
```

#### Configuration:
Set your judge API key in `.env`:
```env
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=AIza...
```

#### Executing a DeepEval Evaluation:
Call the endpoint for an executed scenario:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/integrations/deepeval/evaluate/1" \
  -H "Content-Type: application/json" \
  -d '{"metric_name": "GEval", "threshold": 0.7}'
```
AI TestBench invokes DeepEval's judge, records the semantic score, and correlates it with the scenario's deterministic contract rules.

---

### 2.3 Giskard AI Vulnerability Scanner

Giskard scans conversational chatbots for robustness, hallucination risks, bias, and jailbreaks.

#### Installation:
```bash
pip install giskard
```

#### Running a Security Scan:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/integrations/giskard/scan/1"
```
The Giskard integration wraps the chatbot's `ChatbotAdapter`, probes for safety vulnerabilities, and outputs vulnerability counts and high-risk findings directly into the AI TestBench interface.

---

### 2.4 Langfuse Observability Integration

Langfuse provides open-source observability, tracking tokens, latencies, and execution traces.

#### Configuration:
Add your Langfuse project credentials to `.env`:
```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

#### Lifecycle Hooks:
Whenever a scenario or test suite is executed in AI TestBench, the `LangfuseTracer` records:
- Scenario ID and Contract Title
- Prompt payload and latency
- Token estimates and HTTP status codes
- Evaluation verdict (`PASSED` / `FAILED`)

---

## 3. Multi-Provider LLM Setup

AI TestBench supports multiple LLM providers for natural language requirement compilation, test scenario generation, and semantic evaluation.

### 3.1 Google Gemini
Set `DEFAULT_LLM_PROVIDER=gemini` and supply your Gemini API key in `.env`:
```env
DEFAULT_LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-pro
```

### 3.2 Groq
For ultra-fast test scenario generation, configure Groq:
```env
DEFAULT_LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3.3 OpenRouter
For unified routing across Anthropic, Meta, and OpenAI models:
```env
DEFAULT_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### 3.4 OpenAI & Compatible Endpoints
For OpenAI or local gateways (Ollama, vLLM):
```env
DEFAULT_LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
# For local Ollama:
# OPENAI_BASE_URL=http://localhost:11434/v1
```

### 3.5 Deterministic Mock Provider (Default Offline Mode)
When no external API keys are configured, AI TestBench automatically falls back to `DeterministicMockProvider`. This provider uses sophisticated rule-based token extraction and pattern matching to parse requirements, generate diverse scenarios (positive, boundary, adversarial), and evaluate assertions with zero cloud latency or cost.
