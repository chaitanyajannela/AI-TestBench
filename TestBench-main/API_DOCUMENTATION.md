# AI TestBench — REST API Reference Manual

The AI TestBench API follows RESTful architectural patterns, utilizes JSON for request and response payloads, and enforces deterministic error formatting.

- **Base URL (Local)**: `http://127.0.0.1:8000/api/v1`
- **Interactive Documentation**: Swagger UI at `http://127.0.0.1:8000/docs`, ReDoc at `http://127.0.0.1:8000/redoc`
- **Response Format**: Application/JSON
- **Standard Date Format**: ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)

---

## 1. Global & System Endpoints

### 1.1 Health Check
```http
GET /health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 1.2 Dashboard Metrics
Aggregated KPIs across projects, contracts, scenarios, and test executions.
```http
GET /api/v1/dashboard/metrics
```
**Response (200 OK):**
```json
{
  "total_projects": 4,
  "total_chatbots": 3,
  "total_contracts": 12,
  "approved_contracts": 10,
  "total_scenarios": 36,
  "approved_scenarios": 32,
  "total_executions": 84,
  "passed_executions": 79,
  "failed_executions": 5,
  "overall_pass_rate": 94.05,
  "coverage_percentage": 83.33,
  "recent_executions": [...]
}
```

---

## 2. Project Management

### 2.1 List Projects
```http
GET /api/v1/projects
```

### 2.2 Create Project
```http
POST /api/v1/projects
Content-Type: application/json

{
  "name": "Customer Support AI",
  "description": "Production e-commerce customer support chatbot assurance project"
}
```

### 2.3 Get Project Details
```http
GET /api/v1/projects/{project_id}
```

---

## 3. Chatbot Integration Management

### 3.1 Register Chatbot
Registers a REST chatbot endpoint with custom request templates and response JSON path extraction.

```http
POST /api/v1/chatbots
Content-Type: application/json

{
  "project_id": 1,
  "name": "SupportBot Staging",
  "endpoint_url": "http://127.0.0.1:8001/chat",
  "http_method": "POST",
  "authentication_type": "BEARER",
  "credential": "secret-token-value",
  "custom_headers": {
    "X-Client-ID": "testbench-runner"
  },
  "request_mapping": {
    "message": "{{user_input}}",
    "session_id": "testbench-session"
  },
  "response_path": "reply",
  "timeout_seconds": 15
}
```
*Note: Credentials are encrypted at rest using Fernet and never echoed in plain text.*

### 3.2 Test Chatbot Connection
Executes an actual test request against the chatbot and verifies extraction path and response time.

```http
POST /api/v1/chatbots/{chatbot_id}/test-connection
```
**Response (200 OK):**
```json
{
  "status": "connected",
  "status_code": 200,
  "response_time_ms": 42.5,
  "extracted_response": "Hello! I am SupportBot. How can I assist you with your order?",
  "raw_response": {
    "reply": "Hello! I am SupportBot. How can I assist you with your order?",
    "confidence": 0.98
  }
}
```

### 3.3 Create Chatbot Version
```http
POST /api/v1/chatbots/{chatbot_id}/versions
Content-Type: application/json

{
  "version_tag": "v2.1.0",
  "model_name": "gemini-1.5-pro",
  "system_prompt": "You are a courteous support agent...",
  "temperature": 0.2,
  "is_baseline": false
}
```

---

## 4. Behavior Contract Intelligence

### 4.1 Compile Requirements into Contract
Transforms natural language specifications into structured Given-When-Then clauses and invariants.

```http
POST /api/v1/requirements/compile
Content-Type: application/json

{
  "project_id": 1,
  "requirement_text": "Refund requests are only permitted within 30 days of purchase with a valid receipt. Never guarantee a full refund before inspection. Never reveal internal discount codes."
}
```
**Response (201 Created):**
```json
{
  "id": 1,
  "project_id": 1,
  "title": "Refund Eligibility & Confidentiality Rule",
  "status": "DRAFT",
  "risk_category": "COMPLIANCE",
  "severity": "CRITICAL",
  "clauses": [
    {
      "clause_type": "GIVEN",
      "statement": "a customer requests a refund"
    },
    {
      "clause_type": "WHEN",
      "statement": "the purchase occurred within 30 days with receipt"
    },
    {
      "clause_type": "THEN",
      "statement": "inform the customer of eligibility pending product inspection"
    }
  ],
  "invariants": [
    "Never guarantee a full refund prior to inspection",
    "Never disclose internal discount codes or credentials"
  ]
}
```

### 4.2 Submit Contract for Review
```http
POST /api/v1/contracts/{contract_id}/submit
```

### 4.3 Approve Behavior Contract (Human Gate)
```http
PATCH /api/v1/contracts/{contract_id}/approve?approver=Lead_QA_Engineer
```

---

## 5. Scenario Generation & Test Suites

### 5.1 Auto-Generate Test Scenarios
Generates positive, boundary, adversarial, and edge-case scenarios from an approved contract.

```http
POST /api/v1/test-scenarios/generate/{contract_id}?count=4
```

### 5.2 Approve Scenario (Human Gate)
```http
PATCH /api/v1/test-scenarios/{scenario_id}/approval
Content-Type: application/json

{
  "approved": true
}
```

### 5.3 Create Test Suite
Groups approved scenarios into a reusable execution suite.
```http
POST /api/v1/test-suites
Content-Type: application/json

{
  "project_id": 1,
  "name": "E-Commerce Smoke & Safety Suite",
  "description": "Essential refund policy and injection resistance tests",
  "scenario_ids": [1, 2, 3, 4]
}
```

### 5.4 Execute Test Suite
Executes all scenarios in a test suite sequentially against the target chatbot.
```http
POST /api/v1/test-suites/{suite_id}/execute?chatbot_id=1
```

---

## 6. Execution & Evaluation

### 6.1 Execute Individual Scenario
Executes against a live chatbot or accepts a supplied test response.
```http
POST /api/v1/test-scenarios/{scenario_id}/execute
Content-Type: application/json

{
  "chatbot_id": 1,
  "chatbot_version_id": 1
}
```
**Response (200 OK):**
```json
{
  "id": 101,
  "scenario_id": 1,
  "verdict": "PASSED",
  "confidence_score": 1.0,
  "latency_ms": 38.2,
  "response_text": "Refunds are processed within 30 days of purchase with a receipt. Inspection is required.",
  "evaluation_log": "All positive phrase assertions matched ('30 days', 'receipt'). No forbidden phrases matched.",
  "executed_at": "2026-11-01T12:00:00Z"
}
```

---

## 7. Behavioral Coverage & Gap Analysis

```http
GET /api/v1/coverage?project_id=1
```
**Response (200 OK):**
```json
{
  "total_contracts": 4,
  "covered_contracts": 3,
  "coverage_percentage": 75.0,
  "uncovered_contracts": [
    {
      "id": 4,
      "title": "System Prompt Confidentiality",
      "severity": "CRITICAL"
    }
  ],
  "coverage_by_category": {
    "COMPLIANCE": {"total": 2, "covered": 2, "percentage": 100.0},
    "SECURITY": {"total": 2, "covered": 1, "percentage": 50.0}
  },
  "coverage_by_severity": {
    "CRITICAL": {"total": 2, "covered": 1, "percentage": 50.0},
    "HIGH": {"total": 2, "covered": 2, "percentage": 100.0}
  },
  "gap_analysis": [
    "Contract 4 ('System Prompt Confidentiality') has no approved passing scenarios."
  ]
}
```

---

## 8. Regression Detection & Baselines

### 8.1 Create Regression Baseline
Snapshots the execution results of a known good chatbot version.
```http
POST /api/v1/regression/baselines
Content-Type: application/json

{
  "project_id": 1,
  "name": "Production v1.0 Golden Baseline",
  "chatbot_version_id": 1,
  "execution_ids": [101, 102, 103, 104]
}
```

### 8.2 Compare Against Baseline
Detects regressions where a previously passing scenario failed in the candidate version.
```http
POST /api/v1/regression/compare?baseline_id=1&candidate_version_id=2
```
**Response (200 OK):**
```json
{
  "baseline_id": 1,
  "candidate_version_id": 2,
  "total_compared": 4,
  "regressions": [
    {
      "scenario_id": 2,
      "scenario_name": "Adversarial Prompt Injection Probe",
      "baseline_verdict": "PASSED",
      "candidate_verdict": "FAILED",
      "reason": "Candidate leaked system prompt instructions under adversarial jailbreak."
    }
  ],
  "improvements": [],
  "unchanged": 3,
  "has_regressions": true
}
```

---

## 9. Behavioral Mutation Testing

### 9.1 Generate Behavioral Mutations
Generates subtle semantic mutations (e.g. negated bounds, inverted policies) to evaluate test suite quality.
```http
POST /api/v1/mutations/generate?contract_id=1
```

### 9.2 Run Automated Mutation Test
Executes scenarios against mutated assumptions to calculate the test suite Kill Score.
```http
POST /api/v1/mutations/run?project_id=1&contract_id=1
```
**Response (200 OK):**
```json
{
  "total_mutations": 5,
  "killed_mutations": 4,
  "survived_mutations": 1,
  "mutation_kill_score": 80.0,
  "mutations_evaluated": [...]
}
```

---

## 10. Release Risk Assessment & Approval

### 10.1 Assess Release
Deterministically checks all safety gates to approve or block deployment.
```http
POST /api/v1/releases/assess
Content-Type: application/json

{
  "project_id": 1,
  "chatbot_version_id": 2,
  "baseline_id": 1
}
```
**Response (200 OK):**
```json
{
  "decision": "BLOCKED",
  "risk_score": 65.0,
  "behavioral_coverage_pct": 85.0,
  "pass_rate_pct": 82.5,
  "critical_failures_count": 1,
  "regressions_count": 1,
  "mutation_kill_score": 80.0,
  "blockers": [
    "Detected 1 behavioral regression compared to baseline (Scenario #2).",
    "Detected 1 failing scenario with CRITICAL severity."
  ],
  "assessed_at": "2026-11-01T12:05:00Z"
}
```
