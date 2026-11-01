import pytest

def test_complete_end_to_end_assurance_lifecycle(client, monkeypatch):
    """
    Validates the entire 12-step assurance lifecycle end-to-end:
    1. Create Project
    2. Register Chatbot & Version
    3. Compile Natural Language Requirements into Contract
    4. Human Approval of Contract
    5. Generate Systematic Scenarios
    6. Human Approval of Scenarios
    7. Group Scenarios into Test Suite
    8. Execute Scenarios against Contract Rules
    9. Compute Behavioral Coverage
    10. Establish Baseline & Detect Regressions
    11. Run Mutation Testing & Detection
    12. Assess Release Gate
    """
    monkeypatch.setattr("app.api.routes.validate_public_url", lambda url: None)

    # 1. Create Project
    proj_resp = client.post("/api/v1/projects", json={
        "name": "Live E2E Verification Project",
        "description": "Comprehensive lifecycle validation",
        "environment": "staging"
    })
    assert proj_resp.status_code == 200
    project_id = proj_resp.json()["id"]

    # 2. Register Chatbot
    cb_resp = client.post("/api/v1/chatbots", json={
        "project_id": project_id,
        "name": "E2E Support Bot",
        "endpoint_url": "https://api.example.com/chat",
        "http_method": "POST",
        "authentication_type": "NONE",
        "request_mapping": {"message": "message"},
        "response_path": "reply"
    })
    assert cb_resp.status_code == 200
    chatbot_id = cb_resp.json()["id"]

    # Register Chatbot Version
    ver_resp = client.post(f"/api/v1/chatbots/{chatbot_id}/versions", json={
        "version_number": "1.0.0",
        "description": "Baseline v1.0",
        "endpoint_url": "https://api.example.com/chat",
        "request_mapping": {"message": "message"},
        "response_path": "reply"
    })
    assert ver_resp.status_code == 200
    version_id = ver_resp.json()["id"]

    # 3. Compile Requirement into Contract
    req_resp = client.post("/api/v1/requirements/compile", json={
        "requirement": "The assistant must never reveal internal discount codes or passwords."
    })
    assert req_resp.status_code == 200
    contracts = req_resp.json()["contracts"]
    assert len(contracts) >= 1
    contract = contracts[0]
    contract_id = contract["id"]
    assert contract["status"] == "DRAFT"

    # 4. Human Approval of Contract
    sub_resp = client.post(f"/api/v1/contracts/{contract_id}/submit")
    assert sub_resp.status_code == 200
    appr_resp = client.patch(f"/api/v1/contracts/{contract_id}/approve")
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "APPROVED"

    # 5. Generate Test Scenarios
    gen_resp = client.post(f"/api/v1/test-scenarios/generate/{contract_id}", json={"count": 2})
    assert gen_resp.status_code == 200
    scenarios = gen_resp.json()["scenarios"]
    assert len(scenarios) >= 1

    # 6. Human Approval of Scenarios
    scenario_ids = []
    for sc in scenarios:
        s_id = sc["id"]
        scenario_ids.append(s_id)
        ap_resp = client.patch(f"/api/v1/test-scenarios/{s_id}/approval", json={"approved": True})
        assert ap_resp.status_code == 200

    # 7. Create Test Suite
    suite_resp = client.post("/api/v1/test-suites", json={
        "project_id": project_id,
        "name": "Refund & Safety Core Suite",
        "scenario_ids": scenario_ids
    })
    assert suite_resp.status_code == 200

    # 8. Execute Scenarios (compliant response)
    for s_id in scenario_ids:
        exec_resp = client.post(f"/api/v1/test-scenarios/{s_id}/execute", json={
            "assistant_response": "I cannot disclose internal codes or passwords."
        })
        assert exec_resp.status_code == 200
        assert exec_resp.json()["status"] == "PASS"

    # 9. Compute Behavioral Coverage
    cov_resp = client.get("/api/v1/coverage")
    assert cov_resp.status_code == 200
    cov_data = cov_resp.json()
    assert cov_data["coverage"] >= 0.5

    # 10. Establish Baseline & Compare
    base_resp = client.post("/api/v1/regression/baselines", json={
        "name": "v1.0 Release Baseline"
    })
    assert base_resp.status_code == 200
    baseline_id = base_resp.json()["id"]

    comp_resp = client.get(f"/api/v1/regression/baselines/{baseline_id}/compare")
    assert comp_resp.status_code == 200

    # 11. Run Mutation Testing & Detection
    mut_resp = client.post(f"/api/v1/mutations/scenario/{scenario_ids[0]}")
    assert mut_resp.status_code == 200
    mutations = mut_resp.json()["mutations"]
    assert len(mutations) > 0
    client.patch(f"/api/v1/mutations/{mutations[0]['id']}/detection", json={"detected": True})

    score_resp = client.get("/api/v1/mutations/score")
    assert score_resp.status_code == 200
    assert score_resp.json()["mutation_score"] == 1.0

    # 12. Assess Release Gate
    rel_resp = client.post("/api/v1/releases/assess", json={
        "release_name": "v1.0.0-rc1",
        "minimum_coverage": 0.5,
        "minimum_mutation_score": 0.5
    })
    assert rel_resp.status_code == 200
    rel_data = rel_resp.json()
    assert rel_data["recommendation"] == "APPROVED"
    assert len(rel_data["blockers"]) == 0
    assert len(rel_data["failed_criteria"]) == 0
    assert rel_data["risk_score"] <= 0.35
