"""
╔════════════════════════════════════════════════════════════════════════════════╗
║                    PLATAFORMA INTEGRADA DE TUTORÍAS - BACKEND                 ║
║                              FastAPI Main Application                          ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Este archivo es el punto de entrada principal de la aplicación backend FastAPI.
  Configura la aplicación, maneja rutas, middleware, y ejecuta tareas periódicas.

FUNCIONALIDADES CLAVE:
  1. Configuración inicial de FastAPI con CORS habilitado
  2. Registro de routers para autenticación y horarios
  3. Manejo de errores de validación
  4. Ejecutor de tareas periódicas (recordatorios de sesiones por correo)
  5. Scheduler de recordatorios automáticos cada hora

FLUJO GENERAL:
  Startup → Inicializa BD → Inicia scheduler de recordatorios → API lista para requests
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

# Colombia no observa horario de verano (DST) — UTC-5 durante todo el año
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

# ════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN INICIAL DE LA APLICACIÓN FastAPI
# ════════════════════════════════════════════════════════════════════════════════

app = FastAPI(title="Plataforma Tutorias - FastAPI")

# MIDDLEWARE CORS: Permite que clientes desde cualquier origen accedan a la API
# Esto es necesario para que el frontend (localhost:5173) pueda hacer requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas las rutas (en producción cambiar a dominios específicos)
    allow_credentials=True,  # Permite envío de cookies y headers de autenticación
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, PUT, DELETE, etc)
    allow_headers=["*"],  # Permite todos los headers en requests
)

# MANEJADOR GLOBAL DE ERRORES: Intercepta errores de validación de Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """
    Maneja errores de validación de esquemas Pydantic.
    Retorna detalle del error en formato JSON para debug.
    """
    print(f"[validation_error] {exc.errors()}")
    return JSONResponse(
        status_code=422,  # Unprocessable Entity
        content={"detail": exc.errors(), "body": exc.body},
    )

# ════════════════════════════════════════════════════════════════════════════════
# REGISTRO DE ROUTERS (Submódulos de rutas)
# ════════════════════════════════════════════════════════════════════════════════

# Router de Horarios: Gestiona horarios académicos de tutores y estudiantes
app.include_router(horario_router, prefix="/api/horario")

# Router de Autenticación: Maneja registro, login, y gestión de sesiones
app.include_router(auth_router, prefix="/auth")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


# ════════════════════════════════════════════════════════════════════════════════
# SISTEMA AUTOMÁTICO DE RECORDATORIOS POR CORREO (cada 1 hora)
# ════════════════════════════════════════════════════════════════════════════════

# Set que rastrea IDs de sesiones que ya recibieron recordatorio en esta ejecución
# Cuando el servidor reinicia, los recordatorios se pueden re-enviar (máximo 1x por sesión)
_reminded: set[int] = set()

# ThreadPoolExecutor: Ejecuta tareas de envío de emails en threads separados
# Evita bloquear el loop principal de FastAPI
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="reminder")


def _send_reminders_sync() -> None:
    """
    PROPÓSITO: Busca sesiones que comienzan en ~1 hora y envía recordatorios por correo
    
    FLUJO:
      1. Calcula ventana de tiempo: sesiones entre 55-65 minutos en el futuro
      2. Consulta BD para obtener sesiones en esa ventana
      3. Para cada sesión no recordada anteriormente:
         a. Obtiene estudiantes inscritos en la sesión
         b. Si hay estudiantes, obtiene sus datos y los del tutor
         c. Envía correo de recordatorio a cada estudiante
         d. Marca la sesión como recordada para no re-enviar
      4. Registra errores en consola si ocurren
    """
    db = SessionLocal()
    try:
        # Obtiene hora actual en zona horaria de Colombia (UTC-5)
        now          = datetime.now(tz=COLOMBIA_TZ).replace(tzinfo=None)
        window_start = now + timedelta(minutes=55)  # 55 minutos en el futuro
        window_end   = now + timedelta(minutes=65)  # 65 minutos en el futuro

        # Consulta sesiones que comienzan en la ventana de 1 hora
        sessions = (
            db.query(TutoringSession)
            .filter(
                TutoringSession.date_time >= window_start,
                TutoringSession.date_time <= window_end,
            )
            .all()
        )

        # Procesa cada sesión encontrada
        for session in sessions:
            # Saltar si ya se envió recordatorio para esta sesión
            if session.id in _reminded:
                continue

            # Obtiene inscritos en la sesión
            enrollments = (
                db.query(TutoringEnrollment)
                .filter(TutoringEnrollment.session_id == session.id)
                .all()
            )
            student_ids = [e.student_id for e in enrollments]
            
            # Si no hay estudiantes, marca como recordada y continúa
            if not student_ids:
                _reminded.add(session.id)
                continue

            # Obtiene datos de estudiantes y tutor de la BD
            students = db.query(User).filter(User.id.in_(student_ids)).all()
            tutor    = db.query(User).filter(User.id == session.tutor_id).first()
            dt       = session.date_time

            # Envía correo de recordatorio a cada estudiante inscrito
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

            # Marca sesión como recordada para evitar re-envíos
            _reminded.add(session.id)
            print(f"[reminder] Sent 1-h reminder for session {session.id} ({session.subject}) to {len(students)} student(s)")

    except Exception as e:
        print(f"[reminder] ERROR: {e}")
    finally:
        db.close()


async def _reminder_loop() -> None:
    """
    PROPÓSITO: Loop infinito que ejecuta recordatorios cada 60 segundos
    
    FLUJO:
      1. Obtiene el event loop de asyncio
      2. Cada 60 segundos:
         a. Ejecuta _send_reminders_sync() en un thread separado (no bloquea)
         b. Espera a que se complete
         c. Vuelve a dormir 60 segundos
    """
    loop = asyncio.get_event_loop()
    while True:
        await asyncio.sleep(60)  # Espera 60 segundos
        # Ejecuta función sync en thread pool para no bloquear el event loop
        await loop.run_in_executor(_executor, _send_reminders_sync)


# ════════════════════════════════════════════════════════════════════════════════
# EVENTOS DEL CICLO DE VIDA DE LA APLICACIÓN
# ════════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def on_startup():
    """
    PROPÓSITO: Se ejecuta cuando la aplicación inicia
    
    FLUJO:
      1. Inicializa la base de datos (crea tablas si no existen)
      2. Crea una tarea asincrónica del loop de recordatorios
      3. El servidor ahora está listo para recibir requests
    """
    try:
        # Inicializa la BD: crea tablas según modelos SQLAlchemy
        init_db()
        print("[startup] DB initialized successfully")
    except Exception as e:
        print("[startup] ERROR initializing DB:", e)
        raise

    # Inicia el loop infinito de recordatorios en background
    asyncio.create_task(_reminder_loop())
    print("[startup] 1-hour reminder scheduler started (checks every 60 s)")


# ════════════════════════════════════════════════════════════════════════════════
# PUNTO DE ENTRADA DEL APLICACIÓN
# ════════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    import uvicorn
    # Inicia servidor Uvicorn:
    # - host 0.0.0.0: acepta conexiones desde cualquier interfaz de red
    # - port 8000: escucha en puerto 8000
    # - reload=True: reinicia automáticamente cuando cambia código (desarrollo)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
