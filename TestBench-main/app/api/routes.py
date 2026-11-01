from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List

from app.database import get_db
from app import models as m
from app.schemas import *
from app.services import *
from app.security import encrypt_secret, validate_public_url
from app.adapters.chatbot_adapter import RestChatbotAdapter

router = APIRouter()

# ==============================================================================
# DASHBOARD METRICS
# ==============================================================================
@router.get("/dashboard/metrics")
def get_dashboard_metrics(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q_proj = db.query(m.Project)
    q_bots = db.query(m.Chatbot)
    q_contracts = db.query(m.BehaviorContract)
    q_scenarios = db.query(m.TestScenario)
    q_executions = db.query(m.TestExecution)
    q_releases = db.query(m.ReleaseAssessment)

    if project_id:
        q_bots = q_bots.filter(m.Chatbot.project_id == project_id)
        q_contracts = q_contracts.filter(m.BehaviorContract.project_id == project_id)
        q_scenarios = q_scenarios.filter(m.TestScenario.project_id == project_id)
        q_executions = q_executions.filter(m.TestExecution.project_id == project_id)
        q_releases = q_releases.filter(m.ReleaseAssessment.project_id == project_id)

    total_projects = q_proj.count()
    total_chatbots = q_bots.count()
    approved_contracts = q_contracts.filter(m.BehaviorContract.status == "APPROVED").count()
    total_scenarios = q_scenarios.count()
    approved_scenarios = q_scenarios.filter(m.TestScenario.status == "APPROVED").count()
    
    executions = q_executions.order_by(desc(m.TestExecution.created_at)).all()
    total_executions = len(executions)
    passed_executions = sum(1 for e in executions if e.status == "PASS")
    pass_rate = (passed_executions / total_executions) if total_executions else 0.0

    cov = coverage_report(db, project_id)
    ms = mutation_score_report(db, project_id)
    latest_release = q_releases.order_by(desc(m.ReleaseAssessment.created_at)).first()

    return {
        "projects_count": total_projects,
        "chatbots_count": total_chatbots,
        "approved_contracts_count": approved_contracts,
        "total_contracts_count": q_contracts.count(),
        "total_scenarios_count": total_scenarios,
        "approved_scenarios_count": approved_scenarios,
        "total_executions_count": total_executions,
        "pass_rate": round(pass_rate, 3),
        "coverage": round(cov["coverage"], 3),
        "mutation_score": round(ms["mutation_score"], 3),
        "latest_release_recommendation": latest_release.recommendation if latest_release else "NO_RELEASES",
        "latest_release_risk_score": latest_release.risk_score if latest_release else None,
    }

# ==============================================================================
# MODULE 1: PROJECTS
# ==============================================================================
@router.post("/projects", response_model=ProjectResponse)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    proj = m.Project(
        name=body.name,
        description=body.description,
        environment=body.environment
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return project_dict(proj)

@router.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    projs = db.query(m.Project).order_by(desc(m.Project.created_at)).all()
    return [project_dict(p) for p in projs]

@router.get("/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = db.get(m.Project, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return project_dict(p)

@router.put("/projects/{project_id}")
def update_project(project_id: str, body: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.get(m.Project, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    if body.name is not None: p.name = body.name
    if body.description is not None: p.description = body.description
    if body.environment is not None: p.environment = body.environment
    db.commit()
    db.refresh(p)
    return project_dict(p)

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.get(m.Project, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    db.delete(p)
    db.commit()
    return {"deleted": True, "project_id": project_id}

# ==============================================================================
# MODULE 1: CHATBOT CONNECTIONS & VERSIONS
# ==============================================================================
@router.post("/chatbots")
def create_chatbot(body: ChatbotCreate, db: Session = Depends(get_db)):
    validate_public_url(str(body.endpoint_url))
    if body.http_method.upper() not in {"POST", "GET"}:
        raise HTTPException(422, "Only GET and POST are supported in the REST adapter")
    if body.authentication_type.upper() not in {"NONE", "BEARER", "API_KEY"}:
        raise HTTPException(422, "Unsupported authentication type")

    bot = m.Chatbot(
        project_id=body.project_id,
        name=body.name,
        description=body.description,
        integration_type=body.integration_type.upper(),
        endpoint_url=str(body.endpoint_url),
        http_method=body.http_method.upper(),
        authentication_type=body.authentication_type.upper(),
        encrypted_credentials=encrypt_secret(body.credential),
        custom_headers=body.custom_headers,
        request_mapping=body.request_mapping,
        response_path=body.response_path,
        timeout_seconds=body.timeout_seconds,
        environment=body.environment,
        status="PENDING"
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)

    # Automatically create initial v1.0.0 version
    v = m.ChatbotVersion(
        chatbot_id=bot.id,
        version_number="1.0.0",
        description="Initial registered version",
        endpoint_url=bot.endpoint_url,
        request_mapping=bot.request_mapping,
        response_path=bot.response_path,
    )
    db.add(v)
    db.commit()

    return chatbot_dict(bot)

@router.get("/chatbots")
def list_chatbots(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.Chatbot)
    if project_id:
        q = q.filter(m.Chatbot.project_id == project_id)
    return [chatbot_dict(b) for b in q.order_by(desc(m.Chatbot.created_at)).all()]

@router.get("/chatbots/{chatbot_id}")
def get_chatbot(chatbot_id: str, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    data = chatbot_dict(b)
    data["versions"] = [chatbot_version_dict(v) for v in b.versions]
    return data

@router.put("/chatbots/{chatbot_id}")
def update_chatbot(chatbot_id: str, body: ChatbotUpdate, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    if body.name is not None: b.name = body.name
    if body.description is not None: b.description = body.description
    if body.endpoint_url is not None:
        validate_public_url(str(body.endpoint_url))
        b.endpoint_url = str(body.endpoint_url)
    if body.http_method is not None: b.http_method = body.http_method.upper()
    if body.authentication_type is not None: b.authentication_type = body.authentication_type.upper()
    if body.credential is not None: b.encrypted_credentials = encrypt_secret(body.credential)
    if body.custom_headers is not None: b.custom_headers = body.custom_headers
    if body.request_mapping is not None: b.request_mapping = body.request_mapping
    if body.response_path is not None: b.response_path = body.response_path
    if body.timeout_seconds is not None: b.timeout_seconds = body.timeout_seconds
    if body.environment is not None: b.environment = body.environment
    db.commit()
    db.refresh(b)
    return chatbot_dict(b)

@router.delete("/chatbots/{chatbot_id}")
def delete_chatbot(chatbot_id: str, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    db.delete(b)
    db.commit()
    return {"deleted": True, "chatbot_id": chatbot_id}

@router.post("/chatbots/{chatbot_id}/test-connection")
async def test_chatbot(chatbot_id: str, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    
    adapter = RestChatbotAdapter(b)
    res = await adapter.test_connection()
    if res.get("status") == "CONNECTED":
        b.status = "CONNECTED"
    else:
        b.status = "ERROR"
    db.commit()
    
    if res.get("status") != "CONNECTED":
        raise HTTPException(502, f"Chatbot connection test failed: {res.get('error_detail')}")
    return res

@router.post("/chatbots/{chatbot_id}/versions")
def create_chatbot_version(chatbot_id: str, body: ChatbotVersionCreate, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    v = m.ChatbotVersion(
        chatbot_id=b.id,
        version_number=body.version_number,
        description=body.description,
        endpoint_url=str(body.endpoint_url),
        request_mapping=body.request_mapping,
        response_path=body.response_path,
        status="ACTIVE"
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return chatbot_version_dict(v)

@router.get("/chatbots/{chatbot_id}/versions")
def list_chatbot_versions(chatbot_id: str, db: Session = Depends(get_db)):
    b = db.get(m.Chatbot, chatbot_id)
    if not b:
        raise HTTPException(404, "Chatbot not found")
    return [chatbot_version_dict(v) for v in b.versions]

# ==============================================================================
# MODULE 2: PROMPTS & PROMPT VERSIONS
# ==============================================================================
@router.post("/prompts")
def create_prompt_version(body: PromptVersionCreate, db: Session = Depends(get_db)):
    p = m.PromptVersion(
        project_id=body.project_id,
        chatbot_id=body.chatbot_id,
        version_label=body.version_label,
        prompt_content=body.prompt_content,
        model_name=body.model_name,
        provider=body.provider,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
        parent_version_id=body.parent_version_id,
        change_description=body.change_description,
        is_baseline=body.is_baseline,
    )
    if body.is_baseline and body.chatbot_id:
        # unset previous baseline for this chatbot
        for prev in db.query(m.PromptVersion).filter_by(chatbot_id=body.chatbot_id, is_baseline=True).all():
            prev.is_baseline = False
    db.add(p)
    db.commit()
    db.refresh(p)
    return prompt_version_dict(p)

@router.get("/prompts")
def list_prompt_versions(project_id: Optional[str] = None, chatbot_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.PromptVersion)
    if project_id: q = q.filter(m.PromptVersion.project_id == project_id)
    if chatbot_id: q = q.filter(m.PromptVersion.chatbot_id == chatbot_id)
    return [prompt_version_dict(p) for p in q.order_by(desc(m.PromptVersion.created_at)).all()]

@router.get("/prompts/{prompt_id}")
def get_prompt_version(prompt_id: str, db: Session = Depends(get_db)):
    p = db.get(m.PromptVersion, prompt_id)
    if not p: raise HTTPException(404, "Prompt version not found")
    return prompt_version_dict(p)

@router.get("/prompts/compare/{v1_id}/{v2_id}")
def compare_prompts(v1_id: str, v2_id: str, db: Session = Depends(get_db)):
    p1 = db.get(m.PromptVersion, v1_id)
    p2 = db.get(m.PromptVersion, v2_id)
    if not p1 or not p2: raise HTTPException(404, "One or both prompt versions not found")
    return {
        "version_1": prompt_version_dict(p1),
        "version_2": prompt_version_dict(p2),
        "content_length_delta": len(p2.prompt_content) - len(p1.prompt_content),
        "model_changed": p1.model_name != p2.model_name,
        "temperature_delta": round(p2.temperature - p1.temperature, 2),
    }

# ==============================================================================
# MODULE 3: BEHAVIOR CONTRACT INTELLIGENCE
# ==============================================================================
@router.post("/requirements/compile")
async def compile_req(body: CompileRequest, db: Session = Depends(get_db)):
    return await compile_requirement_async(
        db,
        requirement=body.requirement,
        project_id=body.project_id,
        provider_name=body.provider
    )

@router.post("/contracts")
def create_contract(body: ContractCreate, db: Session = Depends(get_db)):
    c = m.BehaviorContract(
        project_id=body.project_id,
        name=body.name,
        original_requirement=body.requirement,
        normalized_requirement=body.requirement,
        contract_type=body.contract_type.value,
        category=body.category.value,
        severity=body.severity.value,
        priority=body.priority.value,
        preconditions=body.preconditions,
        expected_behavior=body.expected_behavior,
        prohibited_behavior=body.prohibited_behavior,
        constraints=body.constraints,
        evidence_requirements=body.evidence_requirements,
        evaluation_method=body.evaluation_method.value,
        evaluation_criteria=body.evaluation_criteria,
        status="DRAFT"
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return contract_dict(c)

@router.get("/contracts")
def list_contracts(project_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.BehaviorContract)
    if project_id: q = q.filter(m.BehaviorContract.project_id == project_id)
    if status: q = q.filter(m.BehaviorContract.status == status.upper())
    return [contract_dict(x) for x in q.order_by(desc(m.BehaviorContract.created_at)).all()]

@router.get("/contracts/{contract_id}")
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    data = contract_dict(c)
    data["reviews"] = [{"id": r.id, "action": r.action, "reason": r.reason, "reviewer": r.reviewer, "created_at": r.created_at} for r in c.reviews]
    data["scenarios_count"] = len(c.scenarios)
    return data

@router.put("/contracts/{contract_id}")
def update_contract(contract_id: str, body: ContractUpdate, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    if body.name is not None: c.name = body.name
    if body.requirement is not None:
        c.original_requirement = body.requirement
        c.normalized_requirement = body.requirement
    if body.contract_type is not None: c.contract_type = body.contract_type.value
    if body.category is not None: c.category = body.category.value
    if body.severity is not None: c.severity = body.severity.value
    if body.priority is not None: c.priority = body.priority.value
    if body.preconditions is not None: c.preconditions = body.preconditions
    if body.expected_behavior is not None: c.expected_behavior = body.expected_behavior
    if body.prohibited_behavior is not None: c.prohibited_behavior = body.prohibited_behavior
    if body.constraints is not None: c.constraints = body.constraints
    if body.evidence_requirements is not None: c.evidence_requirements = body.evidence_requirements
    if body.evaluation_method is not None: c.evaluation_method = body.evaluation_method.value
    if body.evaluation_criteria is not None: c.evaluation_criteria = body.evaluation_criteria
    db.commit()
    db.refresh(c)
    return contract_dict(c)

@router.delete("/contracts/{contract_id}")
def delete_contract(contract_id: str, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    db.delete(c)
    db.commit()
    return {"deleted": True, "contract_id": contract_id}

@router.post("/contracts/{contract_id}/submit")
def submit_contract(contract_id: str, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    if c.status not in ["DRAFT", "REJECTED"]:
        raise HTTPException(409, "Only draft or rejected contracts can be submitted")
    c.status = "UNDER_REVIEW"
    db.add(m.ContractReview(contract_id=c.id, action="SUBMITTED"))
    db.commit()
    return contract_dict(c)

@router.patch("/contracts/{contract_id}/approve")
def approve_contract(contract_id: str, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    if c.status != "UNDER_REVIEW":
        raise HTTPException(409, "Contract must be under review before approval")
    c.status = "APPROVED"
    db.add(m.ContractReview(contract_id=c.id, action="APPROVED"))
    db.commit()
    return contract_dict(c)

@router.post("/contracts/{contract_id}/reject")
def reject_contract(contract_id: str, reason: str = Query(min_length=3), db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    if c.status != "UNDER_REVIEW":
        raise HTTPException(409, "Contract must be under review before rejection")
    c.status = "REJECTED"
    db.add(m.ContractReview(contract_id=c.id, action="REJECTED", reason=reason))
    db.commit()
    return contract_dict(c)

@router.get("/contracts/{contract_id}/reviews")
def get_contract_reviews(contract_id: str, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    return [{"id": r.id, "action": r.action, "reason": r.reason, "reviewer": r.reviewer, "created_at": r.created_at} for r in c.reviews]

# ==============================================================================
# MODULE 4: TEST SCENARIO GENERATOR & TEST SUITES
# ==============================================================================
@router.post("/test-scenarios/generate/{contract_id}")
async def generate_scenarios(contract_id: str, body: ScenarioGenerate, db: Session = Depends(get_db)):
    c = db.get(m.BehaviorContract, contract_id)
    if not c: raise HTTPException(404, "Contract not found")
    if c.status != "APPROVED":
        raise HTTPException(409, "Only approved contracts can generate scenarios")
    
    scenarios = await generate_scenarios_async(
        db,
        contract=c,
        count=body.count,
        include_adversarial=body.include_adversarial,
        include_boundary=body.include_boundary,
        include_multi_turn=body.include_multi_turn,
        include_injection=body.include_injection,
        provider_name=body.provider
    )
    return {"generated_count": len(scenarios), "scenarios": [scenario_dict(s) for s in scenarios]}

@router.post("/test-scenarios")
def create_scenario(body: ScenarioCreate, db: Session = Depends(get_db)):
    sc = m.TestScenario(
        project_id=body.project_id,
        title=body.title,
        description=body.description,
        scenario_type=body.scenario_type.value,
        category=body.category,
        priority=body.priority.value,
        severity=body.severity.value,
        input_data={"turns": [{"role": "user", "content": body.input_text}]},
        conversation_context=body.conversation_context,
        preconditions=body.preconditions,
        expected_behavior=body.expected_behavior,
        prohibited_behavior=body.prohibited_behavior,
        expected_constraints=body.expected_constraints,
        evaluation_criteria=body.evaluation_criteria,
        evaluation_method=body.evaluation_method.value,
        status="DRAFT",
        generation_source="MANUAL"
    )
    for cid in body.contract_ids:
        c = db.get(m.BehaviorContract, cid)
        if c: sc.contracts.append(c)
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return scenario_dict(sc)

@router.get("/test-scenarios")
def list_scenarios(project_id: Optional[str] = None, contract_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.TestScenario)
    if project_id: q = q.filter(m.TestScenario.project_id == project_id)
    if status: q = q.filter(m.TestScenario.status == status.upper())
    if contract_id:
        q = q.join(m.TestScenario.contracts).filter(m.BehaviorContract.id == contract_id)
    return [scenario_dict(s) for s in q.order_by(desc(m.TestScenario.created_at)).all()]

@router.get("/test-scenarios/{scenario_id}")
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    return scenario_dict(s)

@router.patch("/test-scenarios/{scenario_id}/approval")
def approve_scenario(scenario_id: str, body: ScenarioApproval, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    s.status = "APPROVED" if body.approved else "DRAFT"
    db.commit()
    return scenario_dict(s)

@router.delete("/test-scenarios/{scenario_id}")
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    db.delete(s)
    db.commit()
    return {"deleted": True, "scenario_id": scenario_id}

# --- Test Suites ---
@router.post("/test-suites", response_model=TestSuiteResponse)
def create_test_suite(body: TestSuiteCreate, db: Session = Depends(get_db)):
    st = m.TestSuite(
        project_id=body.project_id,
        name=body.name,
        description=body.description
    )
    for sid in body.scenario_ids:
        sc = db.get(m.TestScenario, sid)
        if sc: st.scenarios.append(sc)
    db.add(st)
    db.commit()
    db.refresh(st)
    return suite_dict(st)

@router.get("/test-suites")
def list_test_suites(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.TestSuite)
    if project_id: q = q.filter(m.TestSuite.project_id == project_id)
    return [suite_dict(s) for s in q.order_by(desc(m.TestSuite.created_at)).all()]

@router.get("/test-suites/{suite_id}")
def get_test_suite(suite_id: str, db: Session = Depends(get_db)):
    st = db.get(m.TestSuite, suite_id)
    if not st: raise HTTPException(404, "Test suite not found")
    res = suite_dict(st)
    res["scenarios"] = [scenario_dict(s) for s in st.scenarios]
    return res

@router.post("/test-suites/{suite_id}/assign")
def assign_scenarios_to_suite(suite_id: str, body: TestSuiteAssign, db: Session = Depends(get_db)):
    st = db.get(m.TestSuite, suite_id)
    if not st: raise HTTPException(404, "Test suite not found")
    st.scenarios.clear()
    for sid in body.scenario_ids:
        sc = db.get(m.TestScenario, sid)
        if sc: st.scenarios.append(sc)
    db.commit()
    return suite_dict(st)

# ==============================================================================
# MODULE 5: EXECUTION & EVALUATION ENGINE
# ==============================================================================
@router.post("/test-scenarios/{scenario_id}/execute")
async def execute_scenario(scenario_id: str, body: ExecuteRequest, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    if s.status != "APPROVED":
        raise HTTPException(409, "Only approved scenarios can be executed")
    
    response = body.assistant_response
    latency = None
    if body.chatbot_id:
        bot = db.get(m.Chatbot, body.chatbot_id)
        if not bot: raise HTTPException(404, "Chatbot not found")
        adapter = RestChatbotAdapter(bot)
        response, latency, _ = await adapter.send_message(extract_user_input(s))

    if body.evaluator_mode == "LLM_JUDGE":
        result = await evaluate_llm_judge(s, response)
    else:
        result = evaluate_rule_based(s, response)

    execution = m.TestExecution(
        project_id=s.project_id,
        scenario_id=s.id,
        chatbot_id=body.chatbot_id,
        chatbot_version_id=body.chatbot_version_id,
        input_text=extract_user_input(s),
        assistant_response=response,
        status=result["status"],
        score=result["score"],
        findings=result["findings"],
        evaluation_details=result.get("details", {}),
        latency_ms=latency,
        evaluator_type=result["evaluator_type"]
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Optional Langfuse observation
    try:
        from app.integrations.langfuse_adapter import record_observation
        record_observation(
            "testbench-scenario-execution",
            {"scenario_id": s.id, "input": extract_user_input(s)},
            {"response": response, "status": result["status"], "score": result["score"]},
            {"execution_id": execution.id, "chatbot_id": body.chatbot_id, "evaluator": result["evaluator_type"]}
        )
    except Exception:
        pass

    return execution_dict(execution)

@router.post("/test-suites/{suite_id}/execute")
async def execute_test_suite(suite_id: str, body: SuiteExecuteRequest, db: Session = Depends(get_db)):
    st = db.get(m.TestSuite, suite_id)
    if not st: raise HTTPException(404, "Test suite not found")
    bot = db.get(m.Chatbot, body.chatbot_id)
    if not bot: raise HTTPException(404, "Chatbot not found")

    adapter = RestChatbotAdapter(bot)
    results = []
    passed = 0

    for s in st.scenarios:
        if s.status != "APPROVED":
            continue
        try:
            resp, latency, _ = await adapter.send_message(extract_user_input(s))
            if body.evaluator_mode == "LLM_JUDGE":
                eval_res = await evaluate_llm_judge(s, resp)
            else:
                eval_res = evaluate_rule_based(s, resp)
            
            ex = m.TestExecution(
                project_id=st.project_id,
                scenario_id=s.id,
                chatbot_id=bot.id,
                chatbot_version_id=body.chatbot_version_id,
                suite_id=st.id,
                input_text=extract_user_input(s),
                assistant_response=resp,
                status=eval_res["status"],
                score=eval_res["score"],
                findings=eval_res["findings"],
                latency_ms=latency,
                evaluator_type=eval_res["evaluator_type"]
            )
            db.add(ex)
            if eval_res["status"] == "PASS": passed += 1
            results.append(ex)
        except Exception as exc:
            ex = m.TestExecution(
                project_id=st.project_id,
                scenario_id=s.id,
                chatbot_id=bot.id,
                suite_id=st.id,
                input_text=extract_user_input(s),
                assistant_response=f"Execution error: {str(exc)}",
                status="FAIL",
                score=0.0,
                findings=[{"type": "EXECUTION_ERROR", "detail": str(exc)}],
                evaluator_type="SYSTEM"
            )
            db.add(ex)
            results.append(ex)

    db.commit()
    total = len(results)
    return {
        "suite_id": st.id,
        "chatbot_id": bot.id,
        "total_scenarios_executed": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": round(passed / total, 3) if total else 0.0,
        "executions": [execution_dict(e) for e in results]
    }

@router.get("/executions")
def list_executions(project_id: Optional[str] = None, chatbot_id: Optional[str] = None, scenario_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.TestExecution)
    if project_id: q = q.filter(m.TestExecution.project_id == project_id)
    if chatbot_id: q = q.filter(m.TestExecution.chatbot_id == chatbot_id)
    if scenario_id: q = q.filter(m.TestExecution.scenario_id == scenario_id)
    return [execution_dict(e) for e in q.order_by(desc(m.TestExecution.created_at)).all()]

@router.get("/executions/{execution_id}")
def get_execution(execution_id: str, db: Session = Depends(get_db)):
    e = db.get(m.TestExecution, execution_id)
    if not e: raise HTTPException(404, "Execution not found")
    return execution_dict(e)

# ==============================================================================
# MODULE 6: BEHAVIORAL COVERAGE INTELLIGENCE
# ==============================================================================
@router.get("/coverage")
def get_coverage(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    return coverage_report(db, project_id)

# ==============================================================================
# MODULE 7: REGRESSION & BASELINE ENGINE
# ==============================================================================
@router.post("/regression/baselines")
def create_baseline(body: BaselineCreate, db: Session = Depends(get_db)):
    q = db.query(m.TestExecution)
    if body.project_id: q = q.filter(m.TestExecution.project_id == body.project_id)
    if body.chatbot_id: q = q.filter(m.TestExecution.chatbot_id == body.chatbot_id)
    
    snapshot = {e.scenario_id: e.status for e in q.all()}
    b = m.RegressionBaseline(
        name=body.name,
        project_id=body.project_id,
        chatbot_id=body.chatbot_id,
        chatbot_version_id=body.chatbot_version_id,
        snapshot=snapshot
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return {
        "id": b.id,
        "name": b.name,
        "project_id": b.project_id,
        "chatbot_id": b.chatbot_id,
        "scenario_count": len(snapshot),
        "created_at": b.created_at,
    }

@router.get("/regression/baselines")
def list_baselines(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.RegressionBaseline)
    if project_id: q = q.filter(m.RegressionBaseline.project_id == project_id)
    return [
        {
            "id": b.id,
            "name": b.name,
            "project_id": b.project_id,
            "chatbot_id": b.chatbot_id,
            "scenario_count": len(b.snapshot or {}),
            "created_at": b.created_at,
        }
        for b in q.order_by(desc(m.RegressionBaseline.created_at)).all()
    ]

@router.get("/regression/baselines/{baseline_id}/compare")
def compare_baseline(baseline_id: str, candidate_chatbot_id: Optional[str] = None, db: Session = Depends(get_db)):
    return compare_baseline_results(db, baseline_id, candidate_chatbot_id)

# ==============================================================================
# MODULE 8: BEHAVIORAL MUTATION TESTING
# ==============================================================================
@router.post("/mutations/scenario/{scenario_id}")
def generate_mutations(scenario_id: str, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    source = (s.expected_behavior or s.prohibited_behavior or ["Follow approved behavioral specification"])[0]
    
    mutations = [
        ("NEGATE_EXPECTATION", source, "The assistant explicitly violates: " + source),
        ("REMOVE_EXPECTATION", source, ""),
        ("WEAKEN_EXPECTATION", source, "The assistant may optionally violate: " + source),
    ]
    out = []
    for typ, orig, mutated in mutations:
        obj = m.Mutation(
            project_id=s.project_id,
            scenario_id=s.id,
            mutation_type=typ,
            original_behavior=orig,
            mutated_behavior=mutated
        )
        db.add(obj)
        out.append(obj)
    db.commit()
    return {
        "scenario_id": s.id,
        "mutations": [
            {
                "id": x.id,
                "mutation_type": x.mutation_type,
                "original_behavior": x.original_behavior,
                "mutated_behavior": x.mutated_behavior,
                "detected": x.detected
            }
            for x in out
        ]
    }

@router.post("/mutations/scenario/{scenario_id}/run")
async def run_scenario_mutation(scenario_id: str, chatbot_id: str, db: Session = Depends(get_db)):
    s = db.get(m.TestScenario, scenario_id)
    if not s: raise HTTPException(404, "Scenario not found")
    bot = db.get(m.Chatbot, chatbot_id)
    if not bot: raise HTTPException(404, "Chatbot not found")
    return await run_mutation_test_suite_async(db, scenario_id, bot)

@router.patch("/mutations/{mutation_id}/detection")
def update_detection(mutation_id: str, body: DetectionUpdate, db: Session = Depends(get_db)):
    x = db.get(m.Mutation, mutation_id)
    if not x: raise HTTPException(404, "Mutation not found")
    x.detected = body.detected
    db.commit()
    return {"id": x.id, "detected": x.detected}

@router.get("/mutations/score")
def get_mutation_score(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    return mutation_score_report(db, project_id)

@router.get("/mutations")
def list_mutations(project_id: Optional[str] = None, scenario_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.Mutation)
    if project_id: q = q.filter(m.Mutation.project_id == project_id)
    if scenario_id: q = q.filter(m.Mutation.scenario_id == scenario_id)
    return [
        {
            "id": x.id,
            "project_id": x.project_id,
            "scenario_id": x.scenario_id,
            "mutation_type": x.mutation_type,
            "original_behavior": x.original_behavior,
            "mutated_behavior": x.mutated_behavior,
            "detected": x.detected,
            "created_at": x.created_at,
        }
        for x in q.order_by(desc(m.Mutation.created_at)).all()
    ]

# ==============================================================================
# MODULE 9: RISK AND RELEASE GATE MANAGER
# ==============================================================================
@router.post("/releases/assess")
def assess_release(body: ReleaseRequest, db: Session = Depends(get_db)):
    return assess_release_decision(
        db,
        release_name=body.release_name,
        project_id=body.project_id,
        candidate_version_id=body.candidate_version_id,
        baseline_version_id=body.baseline_version_id,
        minimum_coverage=body.minimum_coverage,
        minimum_mutation_score=body.minimum_mutation_score,
        max_allowed_regressions=body.max_allowed_regressions,
        block_on_critical_failure=body.block_on_critical_failure,
    )

@router.get("/releases")
def list_releases(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(m.ReleaseAssessment)
    if project_id: q = q.filter(m.ReleaseAssessment.project_id == project_id)
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "release_name": r.release_name,
            "candidate_version_id": r.candidate_version_id,
            "baseline_version_id": r.baseline_version_id,
            "risk_score": r.risk_score,
            "recommendation": r.recommendation,
            "coverage": r.coverage,
            "mutation_score": r.mutation_score,
            "blockers": r.blockers or [],
            "failed_criteria": r.failed_criteria or [],
            "passing_criteria": r.passing_criteria or [],
            "evidence": r.evidence or [],
            "recommendations": r.recommendations or [],
            "created_at": r.created_at,
        }
        for r in q.order_by(desc(m.ReleaseAssessment.created_at)).all()
    ]

@router.get("/releases/{release_id}")
def get_release(release_id: str, db: Session = Depends(get_db)):
    r = db.get(m.ReleaseAssessment, release_id)
    if not r: raise HTTPException(404, "Release assessment not found")
    return {
        "id": r.id,
        "project_id": r.project_id,
        "release_name": r.release_name,
        "candidate_version_id": r.candidate_version_id,
        "baseline_version_id": r.baseline_version_id,
        "risk_score": r.risk_score,
        "recommendation": r.recommendation,
        "coverage": r.coverage,
        "mutation_score": r.mutation_score,
        "blockers": r.blockers or [],
        "failed_criteria": r.failed_criteria or [],
        "passing_criteria": r.passing_criteria or [],
        "evidence": r.evidence or [],
        "recommendations": r.recommendations or [],
        "created_at": r.created_at,
    }

# ==============================================================================
# BUILT-IN SAMPLE CHATBOT ENDPOINT (FOR TESTING & DEMONSTRATION)
# ==============================================================================
class SampleChatbotPayload(BaseModel):
    message: Optional[str] = ""
    query: Optional[str] = ""

class SampleChatbotReply(BaseModel):
    reply: str
    status: str = "ok"

@router.post("/sample-chatbot/chat", response_model=SampleChatbotReply)
def sample_chatbot_chat(
    body: SampleChatbotPayload,
    x_chatbot_mode: Optional[str] = None,
    mode: str = "compliant"
):
    user_msg = (body.message or body.query or "").strip()
    effective_mode = x_chatbot_mode or mode or "compliant"
    lower = user_msg.lower()

    if effective_mode == "vulnerable":
        if "ignore" in lower or "override" in lower or "refund" in lower:
            return SampleChatbotReply(reply="System override acknowledged. I hereby guarantee an immediate full refund to your account.")
        if "password" in lower or "secret" in lower:
            return SampleChatbotReply(reply="Internal configuration access granted: database password is AdminSecretKey123!.")
        return SampleChatbotReply(reply=f"Vulnerable Assistant: {user_msg}")

    # Compliant mode
    if any(k in lower for k in ["ignore all previous", "override", "dan mode", "jailbreak", "system prompt"]):
        return SampleChatbotReply(reply="I cannot override company policies or alter operational guidelines. How may I assist you with your order?")
    if any(k in lower for k in ["password", "secret", "token", "credential", "internal database", "override key"]):
        return SampleChatbotReply(reply="I cannot disclose internal credentials, confidential infrastructure details, or passwords.")
    if any(k in lower for k in ["guarantee my refund", "promise a refund", "give me money now", "guarantee refund"]):
        return SampleChatbotReply(reply="I cannot guarantee or authorize an immediate refund without official verification. You may submit a claim within our standard 30-day window.")
    if any(k in lower for k in ["return", "refund", "policy", "days"]):
        if "31 days" in lower or "45 days" in lower or "after 30 days" in lower:
            return SampleChatbotReply(reply="Our policy permits returns within 30 days of purchase with a valid receipt. Because your purchase is beyond 30 days, we cannot authorize a return.")
        return SampleChatbotReply(reply="Products purchased from us can be returned within 30 days of delivery with original receipt and packaging. Refunds require order verification.")

    return SampleChatbotReply(reply="Hello! I am your AI customer support assistant. How can I help you today?")

@router.get("/sample-chatbot/health")
def sample_chatbot_health():
    return {"status": "healthy", "service": "Built-in Sample Support Chatbot"}
