from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean, Text, JSON, Table, Column, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def now(): return datetime.now(timezone.utc)
def uid(): return str(uuid4())

scenario_contracts = Table(
    "scenario_contracts",
    Base.metadata,
    Column("scenario_id", String(36), ForeignKey("test_scenarios.id", ondelete="CASCADE"), primary_key=True),
    Column("contract_id", String(36), ForeignKey("behavior_contracts.id", ondelete="CASCADE"), primary_key=True)
)

suite_scenarios = Table(
    "suite_scenarios",
    Base.metadata,
    Column("suite_id", String(36), ForeignKey("test_suites.id", ondelete="CASCADE"), primary_key=True),
    Column("scenario_id", String(36), ForeignKey("test_scenarios.id", ondelete="CASCADE"), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    environment: Mapped[str] = mapped_column(String(50), default="development")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    chatbots: Mapped[list["Chatbot"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    contracts: Mapped[list["BehaviorContract"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    test_suites: Mapped[list["TestSuite"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    release_assessments: Mapped[list["ReleaseAssessment"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    prompt_versions: Mapped[list["PromptVersion"]] = relationship(back_populates="project", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = "requirements"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    original_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="COMPILED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    contracts: Mapped[list["BehaviorContract"]] = relationship(back_populates="requirement", cascade="all, delete-orphan")

class BehaviorContract(Base):
    __tablename__ = "behavior_contracts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    requirement_id: Mapped[str | None] = mapped_column(ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    name: Mapped[str] = mapped_column(String(150))
    original_requirement: Mapped[str] = mapped_column(Text)
    normalized_requirement: Mapped[str] = mapped_column(Text)
    contract_type: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(40), default="OTHER")
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    preconditions: Mapped[list] = mapped_column(JSON, default=list)
    expected_behavior: Mapped[list] = mapped_column(JSON, default=list)
    prohibited_behavior: Mapped[list] = mapped_column(JSON, default=list)
    constraints: Mapped[list] = mapped_column(JSON, default=list)
    evidence_requirements: Mapped[list] = mapped_column(JSON, default=list)
    evaluation_method: Mapped[str] = mapped_column(String(30), default="RULE_BASED")
    evaluation_criteria: Mapped[list] = mapped_column(JSON, default=list)
    ambiguities: Mapped[list] = mapped_column(JSON, default=list)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    project: Mapped[Project | None] = relationship(back_populates="contracts")
    requirement: Mapped[Requirement | None] = relationship(back_populates="contracts")
    scenarios: Mapped[list["TestScenario"]] = relationship(secondary=scenario_contracts, back_populates="contracts")
    reviews: Mapped[list["ContractReview"]] = relationship(back_populates="contract", cascade="all, delete-orphan")

class ContractReview(Base):
    __tablename__ = "contract_reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    contract_id: Mapped[str] = mapped_column(ForeignKey("behavior_contracts.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(String(30))
    reviewer: Mapped[str] = mapped_column(String(120), default="local-user")
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    contract: Mapped[BehaviorContract] = relationship(back_populates="reviews")

class TestSuite(Base):
    __tablename__ = "test_suites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    project: Mapped[Project | None] = relationship(back_populates="test_suites")
    scenarios: Mapped[list["TestScenario"]] = relationship(secondary=suite_scenarios, back_populates="test_suites")

class TestScenario(Base):
    __tablename__ = "test_scenarios"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    scenario_type: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(40), default="FUNCTIONAL")
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    input_data: Mapped[dict] = mapped_column(JSON)
    conversation_context: Mapped[dict] = mapped_column(JSON, default=dict)
    preconditions: Mapped[list] = mapped_column(JSON, default=list)
    expected_behavior: Mapped[list] = mapped_column(JSON, default=list)
    prohibited_behavior: Mapped[list] = mapped_column(JSON, default=list)
    expected_constraints: Mapped[list] = mapped_column(JSON, default=list)
    evaluation_criteria: Mapped[list] = mapped_column(JSON, default=list)
    evaluation_method: Mapped[str] = mapped_column(String(30), default="RULE_BASED")
    status: Mapped[str] = mapped_column(String(20), default="DRAFT")
    generation_source: Mapped[str] = mapped_column(String(20), default="RULE_BASED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    contracts: Mapped[list[BehaviorContract]] = relationship(secondary=scenario_contracts, back_populates="scenarios")
    test_suites: Mapped[list[TestSuite]] = relationship(secondary=suite_scenarios, back_populates="scenarios")
    executions: Mapped[list["TestExecution"]] = relationship(back_populates="scenario", cascade="all, delete-orphan")

class Chatbot(Base):
    __tablename__ = "chatbots"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    integration_type: Mapped[str] = mapped_column(String(30), default="REST")
    endpoint_url: Mapped[str] = mapped_column(Text)
    http_method: Mapped[str] = mapped_column(String(10), default="POST")
    authentication_type: Mapped[str] = mapped_column(String(30), default="NONE")
    encrypted_credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_headers: Mapped[dict] = mapped_column(JSON, default=dict)
    request_mapping: Mapped[dict] = mapped_column(JSON, default=lambda: {"message": "message"})
    response_path: Mapped[str] = mapped_column(String(200), default="reply")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=20)
    environment: Mapped[str] = mapped_column(String(50), default="development")
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    project: Mapped[Project | None] = relationship(back_populates="chatbots")
    versions: Mapped[list["ChatbotVersion"]] = relationship(back_populates="chatbot", cascade="all, delete-orphan")
    prompt_versions: Mapped[list["PromptVersion"]] = relationship(back_populates="chatbot", cascade="all, delete-orphan")
    executions: Mapped[list["TestExecution"]] = relationship(back_populates="chatbot")

class ChatbotVersion(Base):
    __tablename__ = "chatbot_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    chatbot_id: Mapped[str] = mapped_column(ForeignKey("chatbots.id", ondelete="CASCADE"))
    version_number: Mapped[str] = mapped_column(String(50), default="1.0.0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    endpoint_url: Mapped[str] = mapped_column(Text)
    request_mapping: Mapped[dict] = mapped_column(JSON, default=lambda: {"message": "message"})
    response_path: Mapped[str] = mapped_column(String(200), default="reply")
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    chatbot: Mapped[Chatbot] = relationship(back_populates="versions")
    executions: Mapped[list["TestExecution"]] = relationship(back_populates="chatbot_version")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    chatbot_id: Mapped[str | None] = mapped_column(ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=True)
    version_label: Mapped[str] = mapped_column(String(50))
    prompt_content: Mapped[str] = mapped_column(Text)
    model_name: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    provider: Mapped[str] = mapped_column(String(50), default="openai")
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=1000)
    parent_version_id: Mapped[str | None] = mapped_column(ForeignKey("prompt_versions.id", ondelete="SET NULL"), nullable=True)
    change_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_baseline: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    project: Mapped[Project | None] = relationship(back_populates="prompt_versions")
    chatbot: Mapped[Chatbot | None] = relationship(back_populates="prompt_versions")
    parent_version: Mapped["PromptVersion | None"] = relationship(remote_side=[id])

class TestExecution(Base):
    __tablename__ = "test_executions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    scenario_id: Mapped[str] = mapped_column(ForeignKey("test_scenarios.id", ondelete="CASCADE"))
    chatbot_id: Mapped[str | None] = mapped_column(ForeignKey("chatbots.id", ondelete="SET NULL"), nullable=True)
    chatbot_version_id: Mapped[str | None] = mapped_column(ForeignKey("chatbot_versions.id", ondelete="SET NULL"), nullable=True)
    prompt_version_id: Mapped[str | None] = mapped_column(ForeignKey("prompt_versions.id", ondelete="SET NULL"), nullable=True)
    suite_id: Mapped[str | None] = mapped_column(ForeignKey("test_suites.id", ondelete="SET NULL"), nullable=True)
    input_text: Mapped[str] = mapped_column(Text)
    assistant_response: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20))
    score: Mapped[float] = mapped_column(Float, default=0)
    findings: Mapped[list] = mapped_column(JSON, default=list)
    evaluation_details: Mapped[dict] = mapped_column(JSON, default=dict)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    evaluator_type: Mapped[str] = mapped_column(String(30), default="RULE_BASED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    scenario: Mapped[TestScenario] = relationship(back_populates="executions")
    chatbot: Mapped[Chatbot | None] = relationship(back_populates="executions")
    chatbot_version: Mapped[ChatbotVersion | None] = relationship(back_populates="executions")

class RegressionBaseline(Base):
    __tablename__ = "regression_baselines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    chatbot_id: Mapped[str | None] = mapped_column(ForeignKey("chatbots.id", ondelete="SET NULL"), nullable=True)
    chatbot_version_id: Mapped[str | None] = mapped_column(ForeignKey("chatbot_versions.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    snapshot: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Mutation(Base):
    __tablename__ = "mutations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    scenario_id: Mapped[str] = mapped_column(ForeignKey("test_scenarios.id", ondelete="CASCADE"))
    mutation_type: Mapped[str] = mapped_column(String(40))
    original_behavior: Mapped[str] = mapped_column(Text)
    mutated_behavior: Mapped[str] = mapped_column(Text)
    detected: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    execution_result: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class ReleaseAssessment(Base):
    __tablename__ = "release_assessments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    release_name: Mapped[str] = mapped_column(String(150))
    candidate_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    baseline_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float)
    recommendation: Mapped[str] = mapped_column(String(30))
    coverage: Mapped[float] = mapped_column(Float)
    mutation_score: Mapped[float] = mapped_column(Float)
    blockers: Mapped[list] = mapped_column(JSON, default=list)
    failed_criteria: Mapped[list] = mapped_column(JSON, default=list)
    passing_criteria: Mapped[list] = mapped_column(JSON, default=list)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    recommendations: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    project: Mapped[Project | None] = relationship(back_populates="release_assessments")

class IntegrationRun(Base):
    __tablename__ = "integration_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    tool: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[str] = mapped_column(String(36))
    status: Mapped[str] = mapped_column(String(30))
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    artifact: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[str] = mapped_column(String(36))
    actor: Mapped[str] = mapped_column(String(100), default="system")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
