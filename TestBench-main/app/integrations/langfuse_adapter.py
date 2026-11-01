import os
import logging
logger = logging.getLogger(__name__)

def record_observation(name: str, input_data: dict, output_data: dict, metadata: dict | None = None) -> bool:
    """Best-effort Langfuse v4 trace. Core execution must not fail if observability is down."""
    if not (os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY")):
        return False
    try:
        from langfuse import get_client
        client = get_client()
        with client.start_as_current_observation(as_type="span", name=name, input=input_data) as span:
            span.update(output=output_data, metadata=metadata or {})
        client.flush()
        return True
    except Exception:
        logger.exception("Langfuse observation failed")
        return False
