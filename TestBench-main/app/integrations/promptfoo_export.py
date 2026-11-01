import io, json, zipfile
from app.services import extract_user_input

def create_promptfoo_bundle(chatbot, scenarios, api_base_url: str) -> bytes:
    """Export approved scenarios to Promptfoo. Provider calls TestBench so executions persist."""
    tests = [{"vars": {"scenario_id": s.id, "input": extract_user_input(s), "expected_status": "PASS"}} for s in scenarios]
    config = {
        "description": "AI TestBench approved behavioral scenarios executed against a registered chatbot",
        "prompts": ["{{input}}"],
        "providers": [{"id": "file://provider.py", "config": {"api_base_url": api_base_url, "chatbot_id": chatbot.id}}],
        "tests": tests,
        "defaultTest": {"assert": [{"type": "python", "value": "file://assertion.py"}]},
    }
    provider = '''import json, os, urllib.request, urllib.error

def call_api(prompt, options, context):
    cfg = (options or {}).get("config", {})
    api_base = os.getenv("TESTBENCH_API_URL", cfg.get("api_base_url", "http://127.0.0.1:8000/api/v1")).rstrip("/")
    chatbot_id = os.getenv("TESTBENCH_CHATBOT_ID", cfg.get("chatbot_id", ""))
    scenario_id = (context or {}).get("vars", {}).get("scenario_id")
    if not chatbot_id or not scenario_id:
        raise RuntimeError("Promptfoo provider needs chatbot_id and scenario_id")
    url = f"{api_base}/test-scenarios/{scenario_id}/execute"
    body = json.dumps({"chatbot_id": chatbot_id}).encode("utf-8")
    request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"TestBench execution failed ({exc.code}): {detail}") from exc
    return {"output": json.dumps(result, ensure_ascii=False), "metadata": {"scenario_id": scenario_id}}
'''
    assertion = '''import json

def get_assert(output, context):
    try:
        result = json.loads(output)
    except Exception:
        return {"pass": False, "score": 0, "reason": "TestBench returned an unreadable execution result."}
    expected = (context or {}).get("vars", {}).get("expected_status", "PASS")
    actual = result.get("status")
    passed = actual == expected
    return {"pass": passed, "score": 1.0 if passed else 0.0,
            "reason": f"Expected {expected}; got {actual}. Findings: {result.get('findings', [])}"}
'''
    readme = f'''# AI TestBench + Promptfoo

1. Start the AI TestBench API.
2. Ensure every scenario in this bundle is approved.
3. Install Node.js 22.22+ and run `npx promptfoo@latest eval`.
4. Run `npx promptfoo@latest view` to inspect results.

The provider calls the TestBench execution API, so executions are saved in TestBench.

Environment overrides:
- `TESTBENCH_API_URL` (default `{api_base_url}`)
- `TESTBENCH_CHATBOT_ID` (default `{chatbot.id}`)

Promptfoo Python provider docs: https://www.promptfoo.dev/docs/integrations/python/
'''
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("promptfooconfig.yaml", json.dumps(config, indent=2, ensure_ascii=False))
        archive.writestr("provider.py", provider)
        archive.writestr("assertion.py", assertion)
        archive.writestr("README.md", readme)
        archive.writestr("requirements.txt", "# Provider uses Python standard library only.\n")
    buffer.seek(0)
    return buffer.getvalue()
