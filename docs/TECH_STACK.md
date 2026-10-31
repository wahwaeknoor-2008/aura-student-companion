# AURA — Technology Stack

## 1. Overview

AURA will use a modular mobile and backend architecture.


The initial stack prioritizes developer productivity, maintainability, scalability, and privacy.

## 2. Frontend — Mobile Application

- Framework: React Native
- Development platform: Expo
- Language: TypeScript
- Navigation: Expo Router
- UI: Reusable component-based architecture
- API communication: REST APIs
- Local storage: Secure storage for sensitive credentials and appropriate local persistence for app data.

## 3. Backend

- Language: Python
- Framework: FastAPI
- API style: REST
- Validation: Pydantic
- Authentication: Secure token-based authentication
- API documentation: OpenAPI / Swagger

## 4. Database

- Primary database: PostgreSQL
- Database access: SQLAlchemy
- Migrations: Alembic
- Semantic search: pgvector

## 5. Artificial Intelligence

- Initial AI provider: OpenAI API
- Backend AI orchestration: Python
- Student-approved memory and context retrieval.
- Future support for local AI models.
- Voice and vision capabilities will be added in later development phases.

AI provider integrations must remain modular so providers can be changed without rewriting the application.

## 6. Security and Privacy

- HTTPS/TLS for network communication.
- Secure authentication and authorization.
- Environment variables for configuration.
- Secret management for API keys.
- Encryption for sensitive stored information.
- Explicit camera and microphone permissions.
- Student-controlled memory and data deletion.

Never commit API keys, passwords, tokens, or private credentials to GitHub.

## 7. Testing

### Mobile
- Component and unit testing.
- Application navigation testing.
- Device testing.

### Backend
- Pytest.
- API integration testing.
- Authentication and authorization testing.

## 8. Development Tools

- Git and GitHub for version control.
- Visual Studio Code for development.
- Expo for mobile development and testing.
- Postman or equivalent for API testing.
- Python virtual environments for backend dependencies.

## 9. Deployment — Future Phase

Potential deployment services will be evaluated when the MVP is ready.

Production infrastructure, database hosting, monitoring, and backups will be selected based on cost, security, and scalability requirements.

## 10. Technology Decision Policy

This is the proposed initial technology stack.

Both developers should discuss significant changes before implementation.

Technology choices should be documented and evaluated based on:

- Maintainability.
- Security and privacy.
- Performance.
- Development complexity.
- Long-term scalability.
