import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

load_dotenv()

class Settings(BaseSettings):
    app_name: str = "AI TestBench"
    app_env: str = "development"
    database_url: str = "sqlite:///./testbench.db"
    api_v1_prefix: str = "/api/v1"
    credential_encryption_key: str = ""
    request_timeout_seconds: int = 20
    allow_private_chatbot_hosts: bool = False
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            if v.startswith("sqlite"):
                path_part = v.replace("sqlite:///", "").replace("sqlite://", "")
                if path_part and not path_part.startswith(":memory:"):
                    dir_name = os.path.dirname(path_part)
                    if dir_name:
                        try:
                            os.makedirs(dir_name, exist_ok=True)
                        except Exception:
                            pass
        return v

settings = Settings()
