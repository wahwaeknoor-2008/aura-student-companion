
import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import re
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, EmailStr
from pwdlib import PasswordHash
from sqlalchemy import create_engine, String, DateTime, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura")

app = FastAPI(
    title="AURA API",
    description="Backend for the AURA student companion.",
    version="0.7.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# DATABASE
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aura.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(default=0)


Base.metadata.create_all(bind=engine)

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)
SESSION_LIFETIME_SECONDS = 12 * 60 * 60


def get_session_secret() -> bytes:
    secret = os.getenv("AURA_SESSION_SECRET")
    if not secret or len(secret) < 32:
        raise HTTPException(
            status_code=503,
            detail="Session authentication is not configured. Check AURA_SESSION_SECRET.",
        )
    return secret.encode("utf-8")


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(student_id: int) -> str:
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": str(student_id),
        "iat": now,
        "exp": now + SESSION_LIFETIME_SECONDS,
    }
    payload_part = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        get_session_secret(),
        payload_part.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{payload_part}.{_b64url_encode(signature)}"


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Student:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Please log in to continue.")

    try:
        payload_part, signature_part = credentials.credentials.split(".", 1)
        expected_signature = hmac.new(
            get_session_secret(),
            payload_part.encode("ascii"),
            hashlib.sha256,
        ).digest()
        supplied_signature = _b64url_decode(signature_part)

        if not hmac.compare_digest(expected_signature, supplied_signature):
            raise ValueError("Invalid signature")

        payload = json.loads(_b64url_decode(payload_part))
        student_id = int(payload["sub"])
        expires_at = int(payload["exp"])

        if expires_at <= int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Expired token")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Your session is invalid or expired. Please log in again.")

    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or not student.is_verified or not student.password_hash:
            raise HTTPException(status_code=401, detail="Your session is no longer valid. Please log in again.")
        # Return a detached object containing only the fields used by routes.
        db.expunge(student)
        return student
    finally:
        db.close()

# --------------------------------------------------
# SECURITY HELPERS
# --------------------------------------------------

def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_university_email(email: str) -> bool:
    # Initial development rule: reject common personal email domains.
    # This does not prove current university enrolment.
    personal_domains = {
        "gmail.com", "outlook.com", "hotmail.com",
        "yahoo.com", "icloud.com", "proton.me",
    }
    domain = email.rsplit("@", 1)[-1].lower()
    return domain not in personal_domains


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")


class CompleteRegistrationRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")
    new_password: str = Field(min_length=12, max_length=128)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


# --------------------------------------------------
# BASIC ROUTES
# --------------------------------------------------

@app.get("/")
def root() -> dict[str, str]:
    return {"name": "AURA API", "status": "running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


# --------------------------------------------------
# STUDENT REGISTRATION
# --------------------------------------------------

@app.post("/auth/register")
def register_student(request: RegisterRequest):
    email = normalize_email(str(request.email))

    if not validate_university_email(email):
        raise HTTPException(
            status_code=400,
            detail="Please use your university email address.",
        )

    db = SessionLocal()

    try:
        existing = db.query(Student).filter(Student.email == email).first()

        if existing and existing.is_verified:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists.",
            )

        # Remove previous verification codes for this email.
        db.query(EmailVerification).filter(
            EmailVerification.email == email
        ).delete()

        code = f"{secrets.randbelow(1000000):06d}"

        verification = EmailVerification(
            email=email,
            code_hash=hash_code(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            attempts=0,
        )

        db.add(verification)

        if not existing:
            db.add(Student(email=email))

        db.commit()

        # DEVELOPMENT ONLY. Replace with real email delivery before launch.
        if os.getenv("AURA_DEV_MODE", "true").lower() == "true":
            logger.info("DEV verification code for %s: %s", email, code)

        return {
            "message": "If this address is eligible, a verification code will be sent.",
            "development_mode": os.getenv("AURA_DEV_MODE", "true").lower() == "true",
        }

    finally:
        db.close()


@app.post("/auth/verify")
def verify_email(request: VerifyRequest):
    email = normalize_email(str(request.email))

    db = SessionLocal()

    try:
        verification = (
            db.query(EmailVerification)
            .filter(EmailVerification.email == email)
            .order_by(EmailVerification.id.desc())
            .first()
        )

        if not verification:
            raise HTTPException(status_code=400, detail="Invalid or expired code.")

        now = datetime.now(timezone.utc)
        expiry = verification.expires_at

        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if now > expiry or verification.attempts >= 5:
            raise HTTPException(status_code=400, detail="Invalid or expired code.")

        if not secrets.compare_digest(
            verification.code_hash,
            hash_code(request.code),
        ):
            verification.attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid or expired code.")

        student = db.query(Student).filter(Student.email == email).first()

        if not student:
            raise HTTPException(status_code=404, detail="Registration not found.")

        student.is_verified = True
        db.delete(verification)
        db.commit()

        return {"message": "Email verified successfully. Create your AURA password."}

    finally:
        db.close()


@app.post("/auth/complete-registration")
def complete_registration(request: CompleteRegistrationRequest):
    email = normalize_email(str(request.email))

    db = SessionLocal()

    try:
        student = db.query(Student).filter(Student.email == email).first()

        if not student or not student.is_verified:
            raise HTTPException(
                status_code=403,
                detail="Please verify your university email first.",
            )

        if student.password_hash:
            raise HTTPException(
                status_code=409,
                detail="An account already exists.",
            )

        student.password_hash = password_hash.hash(request.password)
        db.commit()

        return {
            "message": "AURA account created successfully.",
            "student_id": student.id,
        }

    finally:
        db.close()


# --------------------------------------------------
# PASSWORD RESET
# --------------------------------------------------

@app.post("/auth/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    email = normalize_email(str(request.email))
    db = SessionLocal()

    try:
        student = db.query(Student).filter(Student.email == email).first()

        # Always return the same message to avoid exposing registered emails.
        generic_response = {
            "message": "If an eligible account exists, a password reset code will be issued."
        }

        if not student or not student.is_verified or not student.password_hash:
            return generic_response

        # Replace any previous code for this email.
        db.query(EmailVerification).filter(
            EmailVerification.email == email
        ).delete()

        code = f"{secrets.randbelow(1000000):06d}"
        db.add(
            EmailVerification(
                email=email,
                code_hash=hash_code(code),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
                attempts=0,
            )
        )
        db.commit()

        # Development only: this logs the code in the backend terminal.
        # A real email provider must be configured before production.
        if os.getenv("AURA_DEV_MODE", "true").lower() == "true":
            logger.info("DEV password reset code for %s: %s", email, code)

        return generic_response
    finally:
        db.close()


@app.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest):
    email = normalize_email(str(request.email))
    db = SessionLocal()

    try:
        student = db.query(Student).filter(Student.email == email).first()
        verification = (
            db.query(EmailVerification)
            .filter(EmailVerification.email == email)
            .order_by(EmailVerification.id.desc())
            .first()
        )

        if (
            not student
            or not student.is_verified
            or not student.password_hash
            or not verification
        ):
            raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

        expiry = verification.expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if (
            datetime.now(timezone.utc) > expiry
            or verification.attempts >= 5
            or not secrets.compare_digest(
                verification.code_hash,
                hash_code(request.code),
            )
        ):
            verification.attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

        student.password_hash = password_hash.hash(request.new_password)
        db.delete(verification)
        db.commit()

        return {"message": "Password reset successfully. Please log in with your new password."}
    finally:
        db.close()


# --------------------------------------------------
# LOGIN AND SESSION
# --------------------------------------------------

@app.post("/auth/login")
def login_student(request: LoginRequest):
    email = normalize_email(str(request.email))
    db = SessionLocal()

    try:
        student = db.query(Student).filter(Student.email == email).first()

        # Keep the response generic so the endpoint does not reveal whether
        # an email is registered, verified, or has the wrong password.
        if (
            not student
            or not student.is_verified
            or not student.password_hash
            or not password_hash.verify(request.password, student.password_hash)
        ):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        access_token = create_access_token(student.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": SESSION_LIFETIME_SECONDS,
            "student": {"id": student.id, "email": student.email},
        }
    finally:
        db.close()


@app.get("/auth/me")
def get_my_account(current_student: Student = Depends(get_current_student)):
    return {
        "id": current_student.id,
        "email": current_student.email,
        "is_verified": current_student.is_verified,
    }


# --------------------------------------------------
# GEMINI CHAT — EXISTING FUNCTIONALITY PRESERVED
# --------------------------------------------------

AURA_INSTRUCTIONS = """
You are AURA, a supportive AI companion for university students.

Be warm, calm, friendly, respectful, and conversational.
Listen before offering advice. Keep replies concise and avoid overwhelming
the student with long lists.

Help students build healthy routines, manage academic responsibilities,
and become more independent.

Never shame students for missing tasks or habits.
Do not pretend to have human feelings or experiences.
Do not claim to be a therapist or medical professional.
Do not diagnose mental health conditions.
Encourage appropriate support from trusted people and professionals.
If someone may be in immediate danger, encourage contacting emergency
services or an appropriate crisis resource.

When a student feels bad, acknowledge what they said. Be kind and patient.
Do not immediately jump into productivity advice. Ask whether they want
to talk or would prefer practical help.

Your goal is to support the student, not make them dependent on you.
"""


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_student: Student = Depends(get_current_student),
) -> ChatResponse:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is missing from the backend environment.",
        )

    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    client = genai.Client(api_key=api_key)

    conversation = []

    for item in request.history[-10:]:
        conversation.append(
            types.Content(
                role="user" if item.role == "user" else "model",
                parts=[types.Part.from_text(text=item.content)],
            )
        )

    conversation.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=request.message)],
        )
    )

    def generate_reply():
        return client.models.generate_content(
            model=model,
            contents=conversation,
            config=types.GenerateContentConfig(
                system_instruction=AURA_INSTRUCTIONS,
                temperature=0.6,
                max_output_tokens=300,
            ),
        )

    for attempt in range(2):
        try:
            logger.info("Sending chat request to %s (attempt %s)", model, attempt + 1)
            response = await asyncio.to_thread(generate_reply)

            if not response.text:
                raise HTTPException(
                    status_code=502,
                    detail="Gemini returned an empty response. Please try again.",
                )

            return ChatResponse(reply=response.text.strip())

        except HTTPException:
            raise

        except Exception as error:
            status_code = getattr(error, "code", None)

            if status_code == 503 and attempt == 0:
                logger.warning("Gemini is temporarily unavailable. Retrying once.")
                await asyncio.sleep(1)
                continue

            logger.exception("Gemini chat request failed")

            raise HTTPException(
                status_code=502,
                detail=f"Gemini request failed ({status_code or 'unknown error'}). Check the backend terminal.",
            ) from error

    raise HTTPException(
        status_code=502,
        detail="Gemini is temporarily unavailable. Please try again.",
    )