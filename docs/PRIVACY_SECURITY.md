# AURA — Privacy and Security Principles

## 1. Our Privacy Commitment

AURA is designed around student privacy, transparency, and control.

Students should understand what information AURA collects, why it is needed, where it is processed, and how it can be deleted.

Privacy is a core product requirement, not an optional feature.

## 2. Data Minimization

AURA should collect only the information required to provide requested functionality.

Potential data categories include:

- Account and profile information.
- Academic schedules and tasks.
- Habit and routine information.
- Conversation history and student-approved memory.
- Application preferences and reminder settings.

Sensitive information must not be collected without a clear purpose.

## 3. Encryption

AURA will use established cryptographic standards and trusted libraries.

Requirements:

- HTTPS/TLS for data in transit.
- Encryption at rest for stored sensitive information.
- Secure key management.
- Secure authentication and session handling.
- Appropriate protection for backups.
- No custom-designed cryptographic algorithms.

## 4. End-to-End Encryption

Strict end-to-end encryption is a desired privacy goal.

However, cloud AI processing creates an important limitation: if an external AI provider must receive readable conversation content to generate a response, that content is not end-to-end encrypted against that provider during processing.

AURA must not falsely advertise cloud-processed conversations as strictly end-to-end encrypted.

The architecture will investigate:

- Local AI processing where practical.
- Optional cloud AI processing with informed student consent.
- Hybrid processing that minimizes information sent to external services.
- Established end-to-end encryption protocols for private communications where appropriate.

The final privacy architecture remains an explicit design decision.

## 5. Student-Controlled Memory

Students must be able to:

- View saved memories.
- Correct inaccurate information.
- Delete individual memories.
- Clear conversation history.
- Disable memory.
- Understand how memory is used.

AURA must not silently build sensitive personal profiles.

## 6. Microphone and Camera Privacy

Voice and visual assistance must follow strict consent requirements.

- Microphone access requires permission.
- Camera access requires permission.
- Recording or streaming must be clearly indicated.
- No hidden recording.
- No background camera monitoring.
- Students can stop a live session immediately.
- Images and audio should be processed only for the requested purpose.

## 7. Authentication and Authorization

- Secure password handling or trusted authentication providers.
- Proper session management.
- User-level access controls.
- Server-side authorization checks.
- Protection against unauthorized account access.
- No exposure of one student's data to another student.

## 8. AI Provider Transparency

AURA must clearly explain:

- When information is processed locally.
- When information is sent to cloud AI services.
- What information is shared.
- Which external services are involved.
- Applicable retention and processing practices.

Cloud AI use must follow the student's privacy preferences and applicable provider terms.

## 9. Data Retention and Deletion

Students should have clear controls to:

- Delete conversations.
- Delete saved memories.
- Delete uploaded content.
- Request account deletion.
- Understand backup retention limitations.

Deletion processes must be documented and tested.

## 10. Security Engineering

Development requirements:

- Keep API keys and secrets out of GitHub.
- Use environment variables and secure secret storage.
- Never commit passwords, tokens, private keys, or production credentials.
- Validate API inputs.
- Apply rate limiting where appropriate.
- Maintain dependency updates.
- Perform security testing.
- Log security events without unnecessarily recording private conversation content.

## 11. Privacy Decisions Still to Finalize

The following decisions require further technical evaluation:

1. Local-first versus hybrid AI processing.
2. Encryption and key-management architecture.
3. Account recovery and device migration.
4. Encrypted backup strategy.
5. Data retention periods.
6. External AI provider data-processing configuration.

## 12. Guiding Principle

Students should remain in control of their information.

AURA must earn trust through transparent design, meaningful consent, strong security, and respect for personal boundaries.
