import pytest

def test_project_lifecycle(client):
    res = client.post("/api/v1/projects", json={
        "name": "E-Commerce Support Bot",
        "description": "Evaluation project for customer service AI",
        "environment": "staging"
    })
    assert res.status_code == 200
    proj = res.json()
    assert proj["name"] == "E-Commerce Support Bot"
    pid = proj["id"]

    # List projects
    list_res = client.get("/api/v1/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == pid for p in list_res.json())

    # Update project
    up_res = client.put(f"/api/v1/projects/{pid}", json={"name": "Updated E-Commerce Bot"})
    assert up_res.status_code == 200
    assert up_res.json()["name"] == "Updated E-Commerce Bot"

def test_chatbot_versions_and_prompts(client, monkeypatch):
    monkeypatch.setattr("app.api.routes.validate_public_url", lambda url: None)
    
    # 1. Create project
    proj = client.post("/api/v1/projects", json={"name": "Bot Project"}).json()
    pid = proj["id"]

    # 2. Register chatbot
    bot = client.post("/api/v1/chatbots", json={
        "project_id": pid,
        "name": "Refund Bot",
        "endpoint_url": "https://api.example.com/chat",
        "http_method": "POST",
        "authentication_type": "BEARER",
        "credential": "test-token-123",
        "custom_headers": {"X-Custom": "Val"},
        "request_mapping": {"query": "message"},
        "response_path": "data.reply"
    }).json()
    bid = bot["id"]
    assert bot["project_id"] == pid

    # 3. Add version to chatbot
    v_res = client.post(f"/api/v1/chatbots/{bid}/versions", json={
        "version_number": "1.1.0",
        "description": "Updated prompt version",
        "endpoint_url": "https://api.example.com/chat/v2",
        "request_mapping": {"message": "message"},
        "response_path": "reply"
    })
    assert v_res.status_code == 200
    assert v_res.json()["version_number"] == "1.1.0"

    # 4. Create Prompt Version
    p_res = client.post("/api/v1/prompts", json={
        "project_id": pid,
        "chatbot_id": bid,
        "version_label": "v1.0-system",
        "prompt_content": "You are a customer service assistant. Explain the 30-day return policy.",
        "model_name": "gpt-4o",
        "provider": "openai",
        "temperature": 0.5,
        "is_baseline": True
    })
    assert p_res.status_code == 200
    p1_id = p_res.json()["id"]

    # Create candidate prompt
    p2_res = client.post("/api/v1/prompts", json={
        "project_id": pid,
        "chatbot_id": bid,
        "version_label": "v1.1-candidate",
        "prompt_content": "You are a customer service assistant. Explain the 30-day return policy concisely.",
        "model_name": "gpt-4o",
        "provider": "openai",
        "temperature": 0.2,
        "parent_version_id": p1_id
    })
    assert p2_res.status_code == 200
    p2_id = p2_res.json()["id"]

    # Compare prompts
    cmp_res = client.get(f"/api/v1/prompts/compare/{p1_id}/{p2_id}")
    assert cmp_res.status_code == 200
    diff = cmp_res.json()
    assert diff["temperature_delta"] == -0.3

def test_test_suites_and_batch_assignment(client):
    # Create contract and approve
    c = client.post("/api/v1/contracts", json={
        "name": "Refund Guarantee Constraint",
        "requirement": "The chatbot must never promise an unauthorized refund to a customer.",
        "contract_type": "MUST_NOT",
        "category": "BUSINESS_POLICY",
        "severity": "CRITICAL",
        "expected_behavior": ["Explain that refunds require verification"],
        "prohibited_behavior": ["promise an unauthorized refund"],
        "evaluation_criteria": ["no unauthorized refund commitments"]
    }).json()
    cid = c["id"]
    client.post(f"/api/v1/contracts/{cid}/submit")
    client.patch(f"/api/v1/contracts/{cid}/approve")

    # Generate 3 scenarios
    sc_res = client.post(f"/api/v1/test-scenarios/generate/{cid}", json={"count": 3}).json()
    sids = [s["id"] for s in sc_res["scenarios"]]
    assert len(sids) == 3

    # Create Test Suite
    st = client.post("/api/v1/test-suites", json={
        "name": "Refund Policy Regression Suite",
        "description": "Critical regression checks for refund policy compliance",
        "scenario_ids": sids
    }).json()
    stid = st["id"]
    assert st["scenario_count"] == 3

    # Check suite details
    st_get = client.get(f"/api/v1/test-suites/{stid}").json()
    assert len(st_get["scenarios"]) == 3

def test_dashboard_metrics(client):
    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "projects_count" in data
    assert "approved_contracts_count" in data
    assert "coverage" in data
    assert "mutation_score" in data
