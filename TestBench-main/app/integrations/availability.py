from importlib.util import find_spec
import os
import shutil
from typing import Dict, Any

def integration_status() -> Dict[str, Any]:
    promptfoo_avail = bool(os.getenv("PROMPTFOO_COMMAND")) or (shutil.which("promptfoo") is not None) or (shutil.which("npx") is not None)
    deepeval_avail = find_spec("deepeval") is not None
    deepeval_conf = bool(os.getenv("OPENAI_API_KEY") or os.getenv("DEEPEVAL_MODEL"))
    giskard_avail = find_spec("giskard") is not None
    giskard_conf = bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or os.getenv("GEMINI_API_KEY"))
    langfuse_avail = find_spec("langfuse") is not None
    langfuse_conf = bool(os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"))

    return {
        "promptfoo": {
            "name": "Promptfoo",
            "description": "Adversarial test execution, red-team testing, and prompt comparison via CLI export bundle.",
            "available": promptfoo_avail,
            "configured": promptfoo_avail,
            "enabled": promptfoo_avail,
            "connection_status": "READY" if promptfoo_avail else "UNAVAILABLE",
            "version": "latest (npx)",
            "supported_capabilities": ["PROMPT_EVALUATION", "RED_TEAMING", "ADVERSARIAL_TESTS", "ZIP_BUNDLE_EXPORT"],
            "setup_requirement": "Node.js 22+ with npx promptfoo@latest",
            "last_error": None
        },
        "deepeval": {
            "name": "DeepEval",
            "description": "Production LLM evaluation metrics: GEval, answer relevancy, faithfulness, and custom metrics.",
            "available": deepeval_avail,
            "configured": deepeval_conf,
            "enabled": deepeval_avail and deepeval_conf,
            "connection_status": "READY" if (deepeval_avail and deepeval_conf) else ("MISSING_CONFIG" if deepeval_avail else "NOT_INSTALLED"),
            "version": "3.0+" if deepeval_avail else None,
            "supported_capabilities": ["GEVAL", "ANSWER_RELEVANCY", "FAITHFULNESS", "CUSTOM_METRICS"],
            "setup_requirement": "pip install deepeval and set OPENAI_API_KEY or DEEPEVAL_MODEL",
            "last_error": None if (deepeval_avail and deepeval_conf) else "DeepEval package not installed or model key not set."
        },
        "giskard": {
            "name": "Giskard",
            "description": "AI vulnerability scanning, robustness testing, and hallucination / security checks.",
            "available": giskard_avail,
            "configured": giskard_conf,
            "enabled": giskard_avail and giskard_conf,
            "connection_status": "READY" if (giskard_avail and giskard_conf) else ("MISSING_CONFIG" if giskard_avail else "NOT_INSTALLED"),
            "version": "2.0+" if giskard_avail else None,
            "supported_capabilities": ["VULNERABILITY_SCAN", "ROBUSTNESS_CHECKS", "SECURITY_FINDINGS"],
            "setup_requirement": "pip install giskard[scan] and configure an LLM API key",
            "last_error": None if (giskard_avail and giskard_conf) else "Giskard package not installed or API key not set."
        },
        "langfuse": {
            "name": "Langfuse",
            "description": "LLM observability, execution spans, token usage, latency, and cost tracking.",
            "available": langfuse_avail,
            "configured": langfuse_conf,
            "enabled": langfuse_avail and langfuse_conf,
            "connection_status": "CONNECTED" if (langfuse_avail and langfuse_conf) else ("MISSING_KEYS" if langfuse_avail else "NOT_INSTALLED"),
            "version": "4.0+" if langfuse_avail else None,
            "supported_capabilities": ["TRACING", "TOKEN_USAGE", "LATENCY_TRACKING", "OBSERVABILITY"],
            "setup_requirement": "pip install langfuse and set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY",
            "last_error": None if (langfuse_avail and langfuse_conf) else "Langfuse public/secret keys not set in environment."
        }
    }
