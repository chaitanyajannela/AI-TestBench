from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

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

settings = Settings()
