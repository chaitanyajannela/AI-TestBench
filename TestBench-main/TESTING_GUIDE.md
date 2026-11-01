# AI TestBench — Testing & Quality Assurance Guide

This guide describes the automated testing strategy, execution commands, and test suites included in AI TestBench.

---

## 1. Automated Test Suite Structure

The backend test suite is located in `TestBench-main/tests/` and contains comprehensive test coverage across all architectural modules:

| Test File | Focus & Coverage | Test Count |
|---|---|---|
| `tests/test_platform.py` | Core workflow: projects, contracts, approval gates, scenarios, execution, and release assessment | 5 tests |
| `tests/test_integrations.py` | Third-party integrations: Promptfoo export, DeepEval judge, Giskard scan, Langfuse trace, availability status | 5 tests |
| `tests/test_sample_chatbot.py` | Reference customer support chatbot: compliant response mode, vulnerable response mode, prompt injection rejection | 3 tests |
| `tests/test_enhanced_platform.py` | Enhanced enterprise modules: LLM provider factory, prompt version diffs, test suite batch executions, regression comparisons, mutation runner | 5 tests |

---

## 2. Executing Automated Tests

### 2.1 Running All Tests via Pytest
Activate your virtual environment and execute pytest:
```powershell
cd D:\AI\TestBench-main
pytest -v
```

### 2.2 Running Specific Test Suites
```powershell
# Run core platform tests
pytest tests/test_platform.py -v

# Run enhanced module tests
pytest tests/test_enhanced_platform.py -v

# Run sample chatbot behavior tests
pytest tests/test_sample_chatbot.py -v

# Run external integration tests
pytest tests/test_integrations.py -v
```

### 2.3 Measuring Test Coverage
To measure code coverage with `pytest-cov`:
```powershell
pytest --cov=app --cov-report=term-missing
```

---

## 3. Behavioral Mutation Testing (Module 8)

Mutation testing in AI TestBench evaluates whether your test scenarios are thorough enough to catch subtle defects.

### 3.1 How it Works
1. Given a behavior contract (e.g. *"Refunds permitted within 30 days"*), the mutation engine generates semantic mutations:
   - **Boundary shift**: *"Refunds permitted within 60 days"*
   - **Condition inversion**: *"Refunds permitted without any receipt"*
   - **Constraint removal**: *"Guaranteed immediate refunds without inspection"*
2. The mutation test runner executes your approved scenarios against these mutated expectations.
3. If an approved scenario **fails** against the mutated requirement, the mutation is **KILLED** (a desirable result indicating high test vigilance).
4. If the scenario passes anyway, the mutation **SURVIVED** (highlighting an assertion blindspot).

$$\text{Kill Score} = \left(\frac{\text{Killed Mutations}}{\text{Total Mutations}}\right) \times 100\%$$

Production release gates require a minimum Kill Score of **70.0%**.

---

## 4. End-to-End Workflow Verification

An end-to-end test can be performed against the running FastAPI server and the sample chatbot:
1. Start the sample chatbot on port 8001:
   ```powershell
   python sample_chatbot/app.py
   ```
2. Start the FastAPI server on port 8000:
   ```powershell
   uvicorn app.main:app --port 8000
   ```
3. Run the automated verification script `verify_e2e.py` to assert the entire 9-step workflow automatically:
   - Project created
   - Chatbot connected & tested
   - Requirement compiled into contract
   - Contract approved
   - Scenarios generated & approved
   - Scenarios executed against chatbot
   - Coverage computed
   - Baseline established
   - Mutation test executed
   - Release assessed and gated
