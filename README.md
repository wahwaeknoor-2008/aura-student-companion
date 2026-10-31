# AURA Backend

FastAPI starter API.

Run locally:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Health endpoint: `GET /health`

Interactive API docs: `/docs`

No database, authentication, or AI provider is connected yet.
