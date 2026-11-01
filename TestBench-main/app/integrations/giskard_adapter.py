from pydantic import BaseModel
import os
from app.services import call_chatbot

class AgentInput(BaseModel):
    question: str

class AgentOutput(BaseModel):
    answer: str

async def run_vulnerability_scan(bot, description: str, max_scenarios: int):
    """Run Giskard OSS vulnerability scan against a REST chatbot in single-turn mode."""
    try:
        from giskard.scan import vulnerability_scan
        from giskard.checks import set_default_generator
        model_name = os.getenv("GISKARD_MODEL", "openai/gpt-4o-mini")
        set_default_generator(model_name)
    except ImportError as exc:
        raise RuntimeError('Giskard is not installed. Run: pip install "giskard[scan]"') from exc

    async def target(inputs: AgentInput, chatbot=bot) -> AgentOutput:
        answer, _latency = await call_chatbot(chatbot, inputs.question)
        return AgentOutput(answer=answer)

    result = await vulnerability_scan(
        target=target, description=description, languages=["en"],
        target_mode="singleturn", max_scenarios=max_scenarios,
    )
    suite_json = result.suite.model_dump(mode="json") if getattr(result, "suite", None) else {}
    failures = []
    for scenario_result in getattr(result, "failures_and_errors", []) or []:
        item = {"scenario_name": getattr(scenario_result, "scenario_name", "Unknown"), "findings": []}
        for step in getattr(scenario_result, "failures_and_errors", []) or []:
            for check in getattr(step, "results", []) or []:
                if getattr(check, "failed", False):
                    item["findings"].append(getattr(check, "message", "Check failed"))
        failures.append(item)
    summary = {
        "total_scenarios": len(getattr(result, "results", []) or []),
        "passed": int(getattr(result, "passed_count", 0) or 0),
        "failed": int(getattr(result, "failed_count", 0) or 0),
        "pass_rate": getattr(result, "pass_rate", None),
        "limitations": "LLM-judge findings require human review; a clean scan is not proof of safety.",
        "failures": failures,
    }
    return summary, suite_json
