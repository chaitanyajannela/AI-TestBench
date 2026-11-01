from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import init_db
from app.api.routes import router
from app.api.integrations import router as integrations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app=FastAPI(title=settings.app_name,description="Behavior-first AI assurance: contracts, test generation, execution, coverage, regression, mutation and release risk.",version="1.0.0",lifespan=lifespan)
origins=[x.strip() for x in settings.cors_origins.split(",") if x.strip()]
if "*" in origins:
    app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
else:
    app.add_middleware(CORSMiddleware,allow_origins=origins,allow_origin_regex=r"https://.*\.vercel\.app",allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
app.include_router(router,prefix=settings.api_v1_prefix)
app.include_router(integrations_router,prefix=settings.api_v1_prefix)
@app.get("/")
def root(): return {"name":settings.app_name,"status":"operational","version":"1.0.0","docs":"/docs"}
@app.get("/health")
def health(): return {"status":"healthy","service":settings.app_name}
