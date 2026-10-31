 # AURA — System Architecture

## 1. Overview

AURA uses a modular client-server architecture.

The mobile application provides the student-facing experience. The backend manages authentication, application data, AI orchestration, reminders, and integrations.

## 2. Proposed Technology Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| Semantic search | pgvector |
| AI | OpenAI API initially |
| Version control | Git + GitHub |

These choices are provisional and may evolve as the project develops.

## 3. High-Level Architecture

Student
  |
  v
React Native Mobile Application
  |
  v
FastAPI Backend
  |
  +---- Authentication
  |
  +---- Academic Planner
  |
  +---- Tasks and Habits
  |
  +---- AI Conversation Service
  |
  +---- Student Memory Service
  |
  +---- Reminder Service
  |
  v
PostgreSQL Database

External AI services are accessed through the backend when required and permitted by the student's privacy settings.

## 4. Mobile Application

The mobile application is responsible for:

- Student onboarding and account interface.
- Home dashboard.
- AI conversation interface.
- Academic calendar and planner.
- Daily checklist and habits.
- Progress, achievements, and rewards.
- Voice and camera interfaces.
- Settings and privacy controls.

## 5. Backend

The backend is responsible for:

- Authentication and authorization.
- User profile management.
- Academic data management.
- Tasks and habit tracking.
- AI conversation orchestration.
- Student-approved memory.
- Reminder scheduling.
- Secure communication with external services.

## 6. Database

PostgreSQL will initially store:

- Users and profiles.
- Courses and academic schedules.
- Assignments and deadlines.
- Tasks and checklists.
- Habits and progress.
- Conversation metadata.
- Student-approved memory references.
- Reminder preferences.

Sensitive information must receive appropriate protection and access controls.

## 7. AI Services

The AI service will initially support:

- Natural language conversations.
- Student context retrieval.
- Personalized assistance.
- Academic planning support.
- Everyday life guidance.

AI services must operate within the student's consent and privacy settings.

## 8. Voice and Camera

Voice and camera features will be introduced progressively.

- Voice conversations will use an appropriate real-time audio architecture.
- Camera assistance will process user-authorized images or frames.
- Microphone and camera access must be visible and user-controlled.
- No hidden recording or background monitoring.

## 9. Privacy and Security

- HTTPS for network communication.
- Secure authentication and session management.
- Encryption at rest for sensitive data.
- Established cryptographic protocols and libraries.
- Strict authorization between users.
- Student-controlled memory and data deletion.
- Explicit disclosure when cloud AI processing is used.

Cloud AI processing is not strict end-to-end encryption if the provider must access plaintext to generate a response.

## 10. Development Strategy

Development will happen in stages.

### Stage 1 — Foundation
- Mobile application setup.
- Backend setup.
- Database connection.
- Basic navigation.

### Stage 2 — Student Productivity
- User profiles.
- Tasks and checklists.
- Habits and daily progress.
- Academic planner.

### Stage 3 — AI Companion
- AI conversation endpoint.
- Context-aware responses.
- Student-approved memory.

### Stage 4 — Advanced Assistance
- Voice conversations.
- Camera-based guidance.
- Smart reminders.
- Additional integrations.

## 11. Architecture Principles

1. Modular and maintainable code.
2. Clear separation between frontend and backend.
3. Secure APIs and data access.
4. Privacy by design.
5. Testable components.
6. Incremental development.
7. Documented technical decisions.
