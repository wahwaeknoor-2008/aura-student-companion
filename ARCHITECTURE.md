# AURA — System Architecture

## Overview
AURA uses a modular client-server architecture. The mobile app provides the student experience. The backend manages APIs, authentication, application data, AI orchestration, and integrations.

## Initial stack
- Mobile: React Native, Expo, TypeScript
- Backend: Python, FastAPI, Pydantic
- Database (planned): PostgreSQL
- Semantic retrieval (planned): pgvector
- AI (planned): provider integration behind a backend service

## High-level flow
Student → Mobile application → FastAPI backend → application services → database and approved external services.

## Mobile responsibilities
- Onboarding and profile
- Dashboard and navigation
- Tasks, habits, and academic planner
- AI conversation interface
- Settings and privacy controls
- Future voice/camera interface

## Backend responsibilities
- Authentication and authorization
- User profile and academic data APIs
- Tasks and habit APIs
- AI conversation orchestration
- Student-approved memory
- Reminder scheduling

## Data layer
PostgreSQL is the proposed persistent store. Schema, migrations, backup, retention, and access controls must be designed before storing real student data.

## Privacy and cloud AI
If a cloud AI provider receives readable conversation text to generate a response, that processing is not strict end-to-end encryption against that provider. Do not claim otherwise.

## Development stages
1. Runnable mobile and API foundations.
2. Profiles, tasks, habits, and academic planner.
3. AI conversation and consent-based memory.
4. Reminders, voice, camera, and integrations.
