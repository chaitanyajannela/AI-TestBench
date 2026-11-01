import os, io, asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models as m
from app.schemas import IntegrationEvaluateRequest, GiskardScanRequest, PromptfooExportRequest
from app.services import extract_user_input, call_chatbot
from app.integrations.availability import integration_status
from app.integrations.promptfoo_export import create_promptfoo_bundle
from app.integrations.langfuse_adapter import record_observation

router = APIRouter(prefix="/integrations", tags=["Open-source integrations"])

@router.get("/status")
def get_integration_status():
    return {"integrations": integration_status(), "note": "Optional integrations are loaded only when installed and configured."}

@router.post("/deepeval/evaluate/{scenario_id}")
def deepeval_evaluate(scenario_id: str, body: IntegrationEvaluateRequest, db: Session = Depends(get_db)):
    scenario = db.get(m.TestScenario, scenario_id)
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    if scenario.status != "APPROVED":
        raise HTTPException(409, "Only approved scenarios can be evaluated")
    actual = body.assistant_response
    latency = None
    if body.chatbot_id:
        bot = db.get(m.Chatbot, body.chatbot_id)
        if not bot:
            raise HTTPException(404, "Chatbot not found")
        actual, latency = asyncio.run(call_chatbot(bot, extract_user_input(scenario)))
    expected = "\n".join(scenario.expected_behavior or scenario.evaluation_criteria or [])
    try:
        from app.integrations.deepeval_adapter import evaluate_with_deepeval
        result = evaluate_with_deepeval(user_input=extract_user_input(scenario), actual_output=actual,
            expected_output=expected, criteria=scenario.evaluation_criteria or scenario.expected_behavior,
            threshold=body.threshold)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    execution = m.TestExecution(scenario_id=scenario.id, chatbot_id=body.chatbot_id,
        input_text=extract_user_input(scenario), assistant_response=actual,
        status=result["status"], score=result["score"], findings=[{"type":"DEEPEVAL_JUDGE","detail":result["reason"]}],
        latency_ms=latency, evaluator_type=result["evaluator_type"])
    db.add(execution); db.commit(); db.refresh(execution)
    record_observation("deepeval-contract-evaluation", {"scenario_id": scenario.id}, result,
                       {"execution_id": execution.id, "tool": "DeepEval"})
    return {"execution_id": execution.id, **result}

@router.post("/giskard/scan/{chatbot_id}")
async def giskard_scan(chatbot_id: str, body: GiskardScanRequest, db: Session = Depends(get_db)):
    bot = db.get(m.Chatbot, chatbot_id)
    if not bot:
        raise HTTPException(404, "Chatbot not found")
    try:
        from app.integrations.giskard_adapter import run_vulnerability_scan
        summary, suite_json = await run_vulnerability_scan(bot, body.description, body.max_scenarios)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception as exc:
        raise HTTPException(502, f"Giskard scan failed: {str(exc)[:400]}")
    run = m.IntegrationRun(tool="GISKARD", target_id=bot.id, status="COMPLETED", summary=summary,
                           artifact={"suite": suite_json})
    db.add(run); db.commit(); db.refresh(run)
    record_observation("giskard-vulnerability-scan", {"chatbot_id": bot.id, "description": body.description},
                       summary, {"integration_run_id": run.id})
    return {"integration_run_id": run.id, **summary}

@router.post("/promptfoo/export/{chatbot_id}")
def promptfoo_export(chatbot_id: str, body: PromptfooExportRequest, db: Session = Depends(get_db)):
    bot = db.get(m.Chatbot, chatbot_id)
    if not bot:
        raise HTTPException(404, "Chatbot not found")
    scenarios = db.query(m.TestScenario).filter(m.TestScenario.status == "APPROVED").order_by(m.TestScenario.created_at).all()
    if body.scenario_ids is not None:
        requested = set(body.scenario_ids)
        scenarios = [s for s in scenarios if s.id in requested]
        if len(scenarios) != len(requested):
            raise HTTPException(422, "One or more scenario IDs are missing or not approved")
    if not scenarios:
        raise HTTPException(409, "Approve at least one test scenario before exporting Promptfoo tests")
    api_base = os.getenv("TESTBENCH_PUBLIC_API_URL", "http://127.0.0.1:8000/api/v1")
    bundle = create_promptfoo_bundle(bot, scenarios, api_base)
    return StreamingResponse(io.BytesIO(bundle), media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="testbench-promptfoo-{bot.id[:8]}.zip"'})
