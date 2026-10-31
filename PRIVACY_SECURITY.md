# AURA — Privacy and Security Principles

## Commitment
Students should understand what information AURA collects, why it is needed, where it is processed, and how to delete it.

## Data minimization
Collect only what is necessary for a requested feature. Academic records, conversations, routines, and profile details should be treated as sensitive.

## Security requirements
- HTTPS/TLS for network communication.
- Secure authentication and server-side authorization.
- Encryption at rest for sensitive stored information.
- Established cryptographic protocols and libraries only.
- Secure secret management.
- Input validation, rate limiting, and dependency updates.
- No secrets or real student data in Git.

## End-to-end encryption distinction
Encryption in transit and at rest is not automatically end-to-end encryption. If cloud AI must process readable text, the content is not strictly E2EE against that provider during processing. AURA must describe this honestly.

## Student control
Plan controls to view, correct, export where appropriate, and delete profile data, conversation history, and saved memories. Memory should be opt-in or clearly controlled.

## Camera and microphone
- Explicit permission and clear active-session indicators.
- No hidden recording or background monitoring.
- Students can stop a session immediately.
- Explain whether audio/images are processed locally or sent to a cloud service.

## AI safety
AURA is supportive software, not a therapist, emergency service, or replacement for professional care. High-risk situations require appropriate human and emergency support pathways.
