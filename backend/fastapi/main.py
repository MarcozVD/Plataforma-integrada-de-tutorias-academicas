import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

# Colombia does not observe DST — UTC-5 year-round
COLOMBIA_TZ = timezone(timedelta(hours=-5))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from horario_controller import router as horario_router
from auth_controller import router as auth_router
from db import init_db, SessionLocal
from models import TutoringSession, TutoringEnrollment, User
from email_service import email_reminder

app = FastAPI(title="Plataforma Tutorias - FastAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"[validation_error] {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.include_router(horario_router, prefix="/api/horario")
app.include_router(auth_router, prefix="/auth")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


# ── 1-hour reminder scheduler ──────────────────────────────────────────────────

# Tracks session IDs that already had a reminder sent this server run.
# On restart reminders re-fire at most once per session — acceptable trade-off
# vs adding a DB column / migration.
_reminded: set[int] = set()
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="reminder")


def _send_reminders_sync() -> None:
    """Runs in a thread: query sessions starting in ~1 h and email enrolled students."""
    db = SessionLocal()
    try:
        now          = datetime.now(tz=COLOMBIA_TZ).replace(tzinfo=None)
        window_start = now + timedelta(minutes=55)
        window_end   = now + timedelta(minutes=65)

        sessions = (
            db.query(TutoringSession)
            .filter(
                TutoringSession.date_time >= window_start,
                TutoringSession.date_time <= window_end,
            )
            .all()
        )

        for session in sessions:
            if session.id in _reminded:
                continue

            enrollments = (
                db.query(TutoringEnrollment)
                .filter(TutoringEnrollment.session_id == session.id)
                .all()
            )
            student_ids = [e.student_id for e in enrollments]
            if not student_ids:
                _reminded.add(session.id)
                continue

            students = db.query(User).filter(User.id.in_(student_ids)).all()
            tutor    = db.query(User).filter(User.id == session.tutor_id).first()
            dt       = session.date_time

            for student in students:
                email_reminder(
                    student.email,
                    student.full_name,
                    session.subject,
                    tutor.full_name if tutor else "Tutor",
                    dt.strftime("%d/%m/%Y"),
                    dt.strftime("%H:%M"),
                    session.room,
                    session.duration,
                )

            _reminded.add(session.id)
            print(f"[reminder] Sent 1-h reminder for session {session.id} ({session.subject}) to {len(students)} student(s)")

    except Exception as e:
        print(f"[reminder] ERROR: {e}")
    finally:
        db.close()


async def _reminder_loop() -> None:
    loop = asyncio.get_event_loop()
    while True:
        await asyncio.sleep(60)
        await loop.run_in_executor(_executor, _send_reminders_sync)


@app.on_event("startup")
async def on_startup():
    try:
        init_db()
        print("[startup] DB initialized successfully")
    except Exception as e:
        print("[startup] ERROR initializing DB:", e)
        raise

    asyncio.create_task(_reminder_loop())
    print("[startup] 1-hour reminder scheduler started (checks every 60 s)")


if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
