from fastapi import FastAPI

app = FastAPI(
    title="AURA API",
    description="Backend foundation for the AURA student companion.",
    version="0.1.0",
)


@app.get("/", tags=["general"])
def root() -> dict[str, str]:
    return {"name": "AURA API", "status": "running"}


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
