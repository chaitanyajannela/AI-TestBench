# AI TestBench: execution and deployment guide

## A. Local Windows setup (recommended first)

Use Python 3.12 for the broadest compatibility with the optional evaluation/security integrations. Check installed interpreters:

```powershell
py -0p
```

From the extracted project root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Generate a Fernet encryption key:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the generated value into `.env` as `CREDENTIAL_ENCRYPTION_KEY=...`. Keep this key stable; if it changes, saved chatbot credentials cannot be decrypted.

Start the API:

```powershell
uvicorn app.main:app --reload
```

Check:

- Swagger: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health
- Integration status: http://127.0.0.1:8000/api/v1/integrations/status

Run tests in a second terminal from the project root:

```powershell
.\.venv\Scripts\Activate.ps1
pytest -q
```

## B. Exercise the product in Swagger

1. `POST /api/v1/requirements/compile` with:

```json
{"requirement":"The assistant must never disclose customer passwords."}
```

2. Copy the returned contract ID. Submit it using `POST /api/v1/contracts/{contract_id}/submit`, then approve it using `PATCH /api/v1/contracts/{contract_id}/approve`.
3. Generate scenarios using `POST /api/v1/test-scenarios/generate/{contract_id}` with:

```json
{"count":6,"include_adversarial":true,"include_boundary":true}
```

4. Approve each scenario using `PATCH /api/v1/test-scenarios/{scenario_id}/approval`:

```json
{"approved":true}
```

5. First test manually using `POST /api/v1/test-scenarios/{scenario_id}/execute`:

```json
{"assistant_response":"I cannot reveal or retrieve stored passwords."}
```

6. Register a chatbot with `POST /api/v1/chatbots`. Example shape:

```json
{
  "name":"My support bot",
  "endpoint_url":"https://YOUR-CHATBOT-HOST/chat",
  "http_method":"POST",
  "authentication_type":"BEARER",
  "credential":"YOUR_TOKEN",
  "request_mapping":{"message":"message"},
  "response_path":"reply"
}
```

Replace the endpoint and response path with the actual API contract of your chatbot. Use a test/staging bot, not production customer traffic. Run `POST /api/v1/chatbots/{chatbot_id}/test-connection`. Then execute an approved scenario with:

```json
{"chatbot_id":"YOUR_CHATBOT_ID"}
```

7. Inspect `GET /api/v1/executions` and `GET /api/v1/coverage`.
8. Create a regression baseline with `POST /api/v1/regression/baselines`, then compare with `GET /api/v1/regression/baselines/{baseline_id}/compare`.
9. Generate mutations with `POST /api/v1/mutations/scenario/{scenario_id}`. Record observations using `PATCH /api/v1/mutations/{mutation_id}/detection` and `{"detected":true}` or `false`.
10. Assess a release using `POST /api/v1/releases/assess`:

```json
{"release_name":"staging-0.1","minimum_coverage":0.8,"minimum_mutation_score":0.5}
```

The current deterministic compiler/generator/evaluator are an MVP baseline. Review contracts, generated tests and findings; do not treat a PASS as a safety certification.

## C. Optional open-source integrations

Install only after the core API passes its tests:

```powershell
pip install -r requirements-integrations.txt
```

- Promptfoo: install Node.js 22.22+; call `POST /api/v1/integrations/promptfoo/export/{chatbot_id}` in Swagger and save the returned ZIP. Extract it, open a terminal in that folder, then run `npx promptfoo@latest eval` and `npx promptfoo@latest view`. The export contains approved scenarios only and calls TestBench's execution API.
- DeepEval: configure a supported provider key such as `OPENAI_API_KEY`; call `POST /api/v1/integrations/deepeval/evaluate/{scenario_id}` with a manual response or `chatbot_id`.
- Giskard: configure the model provider key and `GISKARD_MODEL`; call `POST /api/v1/integrations/giskard/scan/{chatbot_id}` with a precise chatbot description and small `max_scenarios` first. This can incur provider API costs and sends prompts/responses to the configured judge provider.
- Langfuse: configure `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`; standard executions are traced best-effort.

## D. Docker local deployment

Install Docker Desktop, then from the project root:

```powershell
Copy-Item .env.example .env
# Put the generated Fernet key in .env
# Set CORS_ORIGINS to the actual frontend origin

docker compose up --build
```

Open `http://localhost:8000/docs`. Data is stored in a Docker named volume. `docker compose down` stops containers without deleting data; `docker compose down -v` deletes the database volume.

## E. Before any internet-facing deployment

This is a development/MVP backend, not safe to expose publicly as-is. Before a public deployment:

1. Add authentication, role-based authorization, project/tenant isolation and audit logs.
2. Put secrets in the hosting provider's secret manager; never upload `.env` to Git.
3. Use HTTPS, strict CORS, rate limits, request-size/time limits and secure headers.
4. Add PostgreSQL and Alembic migrations; configure backups and restore tests.
5. Harden outbound chatbot calls against SSRF with an allowlist/egress proxy, DNS/IP pinning, redirect revalidation and metadata-IP blocking. The current validator is only a development safeguard.
6. Add per-tenant credential encryption and rotation; back up the encryption key securely.
7. Restrict access to logs and traces; redact personal data, prompts, credentials and secrets.
8. Run dependency, container and licence scans; pin dependencies and test upgrade paths.
9. Run the platform against a staging chatbot first. Do not point automated adversarial scans at a production system without written authorization and rate limits.

For a private proof-of-concept, Docker on a machine/VPC you control is the safest next deployment step. Do not enable public ingress until the controls above are implemented.
