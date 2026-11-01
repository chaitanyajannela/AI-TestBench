import os
os.environ["DATABASE_URL"]="sqlite:///./test_testbench.db"
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.database import Base, engine
from app import models

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
@pytest.fixture
def client():
    with TestClient(app) as c: yield c
