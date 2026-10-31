# AURA — Technology Stack

## Mobile
- React Native
- Expo
- TypeScript
- Expo Router or React Navigation (choose one before adding complex navigation)

## Backend
- Python 3.11+
- FastAPI
- Pydantic
- Uvicorn

## Planned data layer
- PostgreSQL
- SQLAlchemy
- Alembic migrations
- pgvector if semantic retrieval is needed

## AI
- AI provider accessed through backend services.
- Keep provider-specific code behind an interface.
- Evaluate local inference and privacy implications before promising local processing.

## Testing
- Mobile: component and device testing.
- Backend: pytest and API integration tests.

## Tooling
- Git and GitHub
- VS Code
- Expo Go / simulator
- Python virtual environment

## Decision policy
This is an initial proposal, not an irreversible commitment. Discuss significant stack changes together and record the decision.
