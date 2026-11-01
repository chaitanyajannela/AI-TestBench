FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY TestBench-main/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application source code, migrations, and sample chatbot
COPY TestBench-main/app ./app
COPY TestBench-main/alembic ./alembic
COPY TestBench-main/alembic.ini ./alembic.ini
COPY TestBench-main/sample_chatbot ./sample_chatbot
COPY TestBench-main/README.md ./README.md

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
