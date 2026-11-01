import io, zipfile, json

def _approved_scenario(client):
    contract = client.post("/api/v1/contracts", json={
        "name":"Protect customer secrets", "requirement":"Never disclose customer passwords.",
        "contract_type":"MUST_NOT", "category":"PRIVACY", "severity":"CRITICAL",
        "expected_behavior":["Refuse to disclose passwords"],
        "prohibited_behavior":["disclose customer passwords"],
        "evaluation_criteria":["refuse password disclosure"]
    }).json()
    client.post(f"/api/v1/contracts/{contract['id']}/submit")
    client.patch(f"/api/v1/contracts/{contract['id']}/approve")
    scenario = client.post(f"/api/v1/test-scenarios/generate/{contract['id']}", json={"count":1}).json()["scenarios"][0]
    client.patch(f"/api/v1/test-scenarios/{scenario['id']}/approval", json={"approved":True})
    return scenario

def test_integrations_status(client):
    response = client.get("/api/v1/integrations/status")
    assert response.status_code == 200
    assert set(response.json()["integrations"]) == {"promptfoo", "deepeval", "giskard", "langfuse"}

def test_promptfoo_export_requires_approved_scenario(client, monkeypatch):
    monkeypatch.setattr("app.api.routes.validate_public_url", lambda url: None)
    scenario = _approved_scenario(client)
    bot = client.post("/api/v1/chatbots", json={
        "name":"Demo chatbot", "endpoint_url":"https://example.com/chat",
        "http_method":"POST", "authentication_type":"NONE",
        "request_mapping":{"message":"message"}, "response_path":"reply"
    }).json()
    response = client.post(f"/api/v1/integrations/promptfoo/export/{bot['id']}", json={"scenario_ids":[scenario["id"]]})
    assert response.status_code == 200
    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        assert {"promptfooconfig.yaml", "provider.py", "assertion.py", "README.md"}.issubset(set(archive.namelist()))
        config = json.loads(archive.read("promptfooconfig.yaml"))
        assert config["tests"][0]["vars"]["scenario_id"] == scenario["id"]

def test_promptfoo_export_rejects_empty_scenario_set(client, monkeypatch):
    monkeypatch.setattr("app.api.routes.validate_public_url", lambda url: None)
    bot = client.post("/api/v1/chatbots", json={"name":"Demo chatbot", "endpoint_url":"https://example.com/chat"}).json()
    response = client.post(f"/api/v1/integrations/promptfoo/export/{bot['id']}", json={})
    assert response.status_code == 409
