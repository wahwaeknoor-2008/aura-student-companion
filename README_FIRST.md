# AURA — ready-to-copy starter bundle

This bundle updates the existing AURA project with:
- University-email registration and verification
- AURA password creation and login
- Password reset
- Signed 12-hour backend sessions
- Authenticated Gemini chat
- The existing AURA dashboard and chat interface

## Copy these files into your existing Codespace

1. Replace `backend/main.py` with this bundle's `backend/main.py`.
2. Replace `mobile/App.tsx` with this bundle's `mobile/App.tsx`.
3. Keep your existing `backend/requirements.txt`, `mobile/package.json`, and `mobile/app.json`.

## One-time install for secure token storage

In the Codespaces terminal:

```bash
cd /workspaces/aura-student-companion/mobile
npx expo install expo-secure-store
```

## Required Codespaces secrets

In repository Settings → Secrets and variables → Codespaces, confirm:
- `GEMINI_API_KEY`
- `AURA_SESSION_SECRET` (at least 32 characters)

Never paste either secret into source code or chat.

## Backend

The existing backend port 8000 may already be running. If it is, saving `backend/main.py` should trigger Uvicorn reload. If not, run:

```bash
cd /workspaces/aura-student-companion/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

Open another terminal:

```bash
cd /workspaces/aura-student-companion/mobile
npx expo start --web
```

Open the forwarded port 8081 in the Codespaces Ports panel.

## Important configuration

`mobile/App.tsx` currently points to the Codespaces backend URL already used in your project:
`https://scary-spooky-cadaver-4jr9jqqg57r6c56x-8000.app.github.dev`

If your Codespace is recreated and the URL changes, update `API_BASE_URL` near the top of `App.tsx`.

## Development-only limitations

- Email verification and password-reset codes are logged to the backend terminal while `AURA_DEV_MODE=true`. No email is sent yet.
- University-domain filtering is only a basic email-domain check; it does not prove current enrolment.
- CORS is open for development and must be restricted before production.
- The current Gemini cloud integration sends chat text to Google's service; it is not end-to-end encrypted.
- The app is a working authentication/chat foundation, not the full product vision (tasks, academic planner, habits, reminders, audio/video, and persistent conversation memory are not implemented yet).
