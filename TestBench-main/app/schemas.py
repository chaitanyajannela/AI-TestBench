from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, model_validator, HttpUrl
from typing import Any, Optional

# --- Enums ---
class ContractType(str, Enum):
    MUST = "MUST"
    MUST_NOT = "MUST_NOT"
    SHOULD = "SHOULD"
    SHOULD_NOT = "SHOULD_NOT"
    CONDITIONAL = "CONDITIONAL"

class ContractCategory(str, Enum):
    FUNCTIONAL = "FUNCTIONAL"
    PRIVACY = "PRIVACY"
    SECURITY = "SECURITY"
    ACCURACY = "ACCURACY"
    BUSINESS_POLICY = "BUSINESS_POLICY"
    COMMUNICATION = "COMMUNICATION"
    FORMATTING = "FORMATTING"
    SAFETY = "SAFETY"
    REFUSAL = "REFUSAL"
    QUALITY = "QUALITY"
    OTHER = "OTHER"

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class EvaluationMethod(str, Enum):
    RULE_BASED = "RULE_BASED"
    SEMANTIC = "SEMANTIC"
    LLM_JUDGE = "LLM_JUDGE"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    HYBRID = "HYBRID"

class ScenarioType(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    BOUNDARY = "BOUNDARY"
    AMBIGUOUS = "AMBIGUOUS"
    ADVERSARIAL = "ADVERSARIAL"
    CONTRADICTORY = "CONTRADICTORY"
    MULTI_TURN = "MULTI_TURN"
    SAFETY = "SAFETY"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    REGRESSION = "REGRESSION"

# --- Projects ---
class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    environment: str = Field(default="development", max_length=50)

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    environment: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    environment: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Chatbots ---
class ChatbotCreate(BaseModel):
    project_id: Optional[str] = None
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    integration_type: str = "REST"
    endpoint_url: HttpUrl
    http_method: str = "POST"
    authentication_type: str = "NONE"
    credential: Optional[str] = None
    custom_headers: dict[str, str] = {}
    request_mapping: dict[str, str] = {"message": "message"}
    response_path: str = "reply"
    timeout_seconds: int = Field(default=20, ge=1, le=120)
    environment: str = "development"

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    endpoint_url: Optional[HttpUrl] = None
    http_method: Optional[str] = None
    authentication_type: Optional[str] = None
    credential: Optional[str] = None
    custom_headers: Optional[dict[str, str]] = None
    request_mapping: Optional[dict[str, str]] = None
    response_path: Optional[str] = None
    timeout_seconds: Optional[int] = None
    environment: Optional[str] = None

class ChatbotResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    integration_type: str
    endpoint_url: str
    http_method: str
    authentication_type: str
    request_mapping: dict[str, str]
    response_path: str
    timeout_seconds: int
    environment: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Chatbot Versions ---
class ChatbotVersionCreate(BaseModel):
    version_number: str = Field(min_length=1, max_length=50)
    description: Optional[str] = None
    endpoint_url: HttpUrl
    request_mapping: dict[str, str] = {"message": "message"}
    response_path: str = "reply"

class ChatbotVersionResponse(BaseModel):
    id: str
    chatbot_id: str
    version_number: str
    description: Optional[str] = None
    endpoint_url: str
    request_mapping: dict[str, str]
    response_path: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Prompt Versions ---
class PromptVersionCreate(BaseModel):
    project_id: Optional[str] = None
    chatbot_id: Optional[str] = None
    version_label: str = Field(min_length=1, max_length=50)
    prompt_content: str = Field(min_length=1)
    model_name: str = "gpt-4o-mini"
    provider: str = "openai"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, ge=1)
    parent_version_id: Optional[str] = None
    change_description: Optional[str] = None
    is_baseline: bool = False

class PromptVersionResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    chatbot_id: Optional[str] = None
    version_label: str
    prompt_content: str
    model_name: str
    provider: str
    temperature: float
    max_tokens: int
    parent_version_id: Optional[str] = None
    change_description: Optional[str] = None
    is_baseline: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Contracts ---
class ContractCreate(BaseModel):
    project_id: Optional[str] = None
    name: str = Field(min_length=3, max_length=150)
    requirement: str = Field(min_length=10, max_length=5000)
    contract_type: ContractType
    category: ContractCategory = ContractCategory.OTHER
    severity: Severity = Severity.MEDIUM
    priority: Severity = Severity.MEDIUM
    preconditions: list[str] = []
    expected_behavior: list[str] = []
    prohibited_behavior: list[str] = []
    constraints: list[str] = []
    evidence_requirements: list[str] = []
    evaluation_method: EvaluationMethod = EvaluationMethod.RULE_BASED
    evaluation_criteria: list[str] = []

    @model_validator(mode="after")
    def check_behavior(self):
        if not self.expected_behavior and not self.prohibited_behavior:
            raise ValueError("Expected or prohibited behavior is required")
        if self.contract_type == ContractType.MUST_NOT and not self.prohibited_behavior:
            raise ValueError("MUST_NOT requires prohibited behavior")
        if self.contract_type == ContractType.CONDITIONAL and not self.preconditions:
            raise ValueError("CONDITIONAL requires preconditions")
        return self

class ContractUpdate(BaseModel):
    name: Optional[str] = None
    requirement: Optional[str] = None
    contract_type: Optional[ContractType] = None
    category: Optional[ContractCategory] = None
    severity: Optional[Severity] = None
    priority: Optional[Severity] = None
    preconditions: Optional[list[str]] = None
    expected_behavior: Optional[list[str]] = None
    prohibited_behavior: Optional[list[str]] = None
    constraints: Optional[list[str]] = None
    evidence_requirements: Optional[list[str]] = None
    evaluation_method: Optional[EvaluationMethod] = None
    evaluation_criteria: Optional[list[str]] = None

class CompileRequest(BaseModel):
    project_id: Optional[str] = None
    requirement: str = Field(min_length=10, max_length=5000)
    provider: Optional[str] = None

# --- Test Suites ---
class TestSuiteCreate(BaseModel):
    project_id: Optional[str] = None
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    scenario_ids: list[str] = []

class TestSuiteResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    scenario_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TestSuiteAssign(BaseModel):
    scenario_ids: list[str]

# --- Test Scenarios ---
class ScenarioCreate(BaseModel):
    project_id: Optional[str] = None
    contract_ids: list[str] = []
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3)
    scenario_type: ScenarioType = ScenarioType.POSITIVE
    category: str = "FUNCTIONAL"
    priority: Severity = Severity.MEDIUM
    severity: Severity = Severity.MEDIUM
    input_text: str = Field(min_length=1)
    conversation_context: dict[str, Any] = {}
    preconditions: list[str] = []
    expected_behavior: list[str] = []
    prohibited_behavior: list[str] = []
    expected_constraints: list[str] = []
    evaluation_criteria: list[str] = []
    evaluation_method: EvaluationMethod = EvaluationMethod.RULE_BASED

class ScenarioGenerate(BaseModel):
    count: int = Field(default=6, ge=1, le=50)
    include_adversarial: bool = True
    include_boundary: bool = True
    include_multi_turn: bool = True
    include_injection: bool = True
    provider: Optional[str] = None

class ScenarioApproval(BaseModel):
    approved: bool

# --- Executions ---
class ExecuteRequest(BaseModel):
    assistant_response: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    chatbot_id: Optional[str] = None
    chatbot_version_id: Optional[str] = None
    evaluator_mode: Optional[str] = "RULE_BASED"

    @model_validator(mode="after")
    def require_response_or_chatbot(self):
        if not self.assistant_response and not self.chatbot_id:
            raise ValueError("Provide assistant_response or chatbot_id")
        return self

class SuiteExecuteRequest(BaseModel):
    chatbot_id: str
    chatbot_version_id: Optional[str] = None
    evaluator_mode: str = "HYBRID"

class IntegrationEvaluateRequest(BaseModel):
    assistant_response: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    chatbot_id: Optional[str] = None
    threshold: float = Field(default=0.7, ge=0, le=1)

    @model_validator(mode="after")
    def require_response_or_chatbot(self):
        if not self.assistant_response and not self.chatbot_id:
            raise ValueError("Provide assistant_response or chatbot_id")
        return self

class GiskardScanRequest(BaseModel):
    description: str = Field(min_length=20, max_length=4000)
    max_scenarios: int = Field(default=5, ge=1, le=30)

class PromptfooExportRequest(BaseModel):
    scenario_ids: Optional[list[str]] = None

# --- Baselines & Regression ---
class BaselineCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    project_id: Optional[str] = None
    chatbot_id: Optional[str] = None
    chatbot_version_id: Optional[str] = None

# --- Mutations ---
class MutationGenerateRequest(BaseModel):
    scenario_id: str

class DetectionUpdate(BaseModel):
    detected: bool

# --- Releases ---
class ReleaseRequest(BaseModel):
    project_id: Optional[str] = None
    release_name: str
    candidate_version_id: Optional[str] = None
    baseline_version_id: Optional[str] = None
    minimum_coverage: float = Field(default=0.8, ge=0, le=1)
    minimum_mutation_score: float = Field(default=0.5, ge=0, le=1)
    max_allowed_regressions: int = Field(default=0, ge=0)
    block_on_critical_failure: bool = True
