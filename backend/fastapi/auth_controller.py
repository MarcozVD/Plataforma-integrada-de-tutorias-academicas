"""
╔════════════════════════════════════════════════════════════════════════════════╗
║              CONTROLADOR DE AUTENTICACIÓN - FastAPI                            ║
║            Gestión de registro, login, y preferencias de usuarios              ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Controla todo el flujo de autenticación: registro, login, recuperación de contraseña.
  Maneja tokens JWT para mantener sesiones seguras.

ENDPOINTS PRINCIPALES:
  POST   /auth/register/student - Registro de estudiante
  POST   /auth/register/tutor - Registro de tutor
  POST   /auth/login - Iniciar sesión
  GET    /auth/me - Obtener datos del usuario actual
  POST   /auth/forgot-password - Solicitar recuperación
  POST   /auth/reset-password - Resetear contraseña
  PUT    /auth/preferences - Actualizar preferencias
  PUT    /auth/disability - Actualizar discapacidad

FLUJO:
  Usuario llena formulario → Validaciones → Hash contraseña → Crea registro en BD
  → Envía email bienvenida → Usuario puede loguear → JWT creado → API protegida
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Header
from sqlalchemy import func
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from sqlalchemy.orm import Session, joinedload
from db import SessionLocal
from models import User, InterestSubject, TutoringPreference, UserDisability, TutoringSession, TutoringEnrollment, Room, RoomAvailability, PasswordResetToken, WaitlistEntry, TutorRating
import bcrypt  # Hashing de contraseñas
import secrets  # Generación de tokens aleatorios
import traceback
from fastapi.responses import JSONResponse
import os
import re
from jose import jwt  # JSON Web Tokens para autenticación
from dotenv import load_dotenv
from typing import Literal
from datetime import datetime, timedelta
from email_service import (
    email_welcome,
    email_enrollment_confirmation,
    email_enrollment_cancelled,
    email_session_cancelled_by_tutor,
    email_password_reset,
    email_waitlist_spot_available,
)

# ════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE SEGURIDAD (JWT)
# ════════════════════════════════════════════════════════════════════════════════

load_dotenv()  # Carga variables de entorno

# Clave secreta para firmar tokens JWT (cambiar en producción)
SECRET_KEY = os.getenv("XOsFw_ir9cwCC-liLKURVCFUPPKc7BOYzytN-CvurYA", "please-change-me")
ALGORITHM = "HS256"  # Algoritmo para firmar JWT

router = APIRouter()

# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES: Hash y verificación de contraseñas
# ════════════════════════════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """
    PROPÓSITO: Hash seguro de contraseña con bcrypt
    FLUJO: Contraseña → bcrypt con salt → Hash almacenable
    NUNCA se debe almacenar contraseña en texto plano
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    PROPÓSITO: Verifica si contraseña ingresada coincide con hash en BD
    RETORNA: True si coincide, False si no
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_db():
    """
    PROPÓSITO: Dependency que proporciona sesión de BD a cada ruta
    FLUJO: Crea sesión → Ruta usa sesión → Cierra sesión al terminar
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ════════════════════════════════════════════════════════════════════════════════
# MODELOS PYDANTIC: Esquemas de validación para requests/responses
# ════════════════════════════════════════════════════════════════════════════════

class _BaseRegister(BaseModel):
    """
    PROPÓSITO: Base común para validaciones de registro (estudiante y tutor)
    
    VALIDACIONES:
      - full_name: Mínimo 3 chars, solo letras y espacios
      - university_id: 5-15 dígitos numéricos (código de estudiante)
      - password: Mín 8 chars, mayúscula, número
      - carrera: Mínimo 2 caracteres
      - Confirmación: password == confirm_password
    """
    full_name: str
    email: EmailStr  # Validación de email automática
    password: str
    confirm_password: str
    university_id: str
    carrera: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Valida que nombre contenga solo letras y espacios (incluyendo acentos)"""
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre completo debe tener al menos 3 caracteres")
        if not re.match(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$", v):
            raise ValueError("El nombre solo puede contener letras y espacios")
        return v

    @field_validator("university_id")
    @classmethod
    def validate_university_id(cls, v: str) -> str:
        """Valida que ID sea número de 5-15 dígitos"""
        v = v.strip()
        if not re.match(r"^\d{5,15}$", v):
            raise ValueError("El número de identificación debe tener entre 5 y 15 dígitos numéricos")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida que contraseña cumpla requisitos de seguridad"""
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v

    @field_validator("carrera")
    @classmethod
    def validate_carrera(cls, v: str) -> str:
        """Valida que carrera tenga mínimo 2 caracteres"""
        v = v.strip()
        if len(v) < 2:
            raise ValueError("La carrera debe tener al menos 2 caracteres")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self) -> "_BaseRegister":
        """Valida que password y confirm_password coincidan"""
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden")
        return self


class StudentRegisterIn(_BaseRegister):
    """
    PROPÓSITO: Schema de registro para ESTUDIANTES
    CAMPO ESPECIAL:
      - disability_type: "ninguna", "visual", "auditiva", "motriz", "cognitiva"
      - disability_description: Descripción de necesidades (opcional)
    """
    user_type: Literal["student"] = "student"
    disability_type: Literal["ninguna", "visual", "auditiva", "motriz", "cognitiva"]
    disability_description: str | None = None


class TutorRegisterIn(_BaseRegister):
    """
    PROPÓSITO: Schema de registro para TUTORES
    CAMPO ESPECIAL:
      - disability_support_type: Qué discapacidades puede atender el tutor
      - disability_support_description: Detalles del soporte que puede dar
    """
    user_type: Literal["tutor"] = "tutor"
    disability_support_type: Literal["ninguna", "visual", "auditiva", "motriz", "cognitiva", "todas"]
    disability_support_description: str | None = None


class RoomAvailabilityIn(BaseModel):
    """Schema para disponibilidad de aula"""
    day: str | None = None  # "Lunes", "Martes", etc.
    specific_date: str | None = None  # "2024-05-22"
    start_time: str  # "08:00"
    end_time: str  # "18:00"

class RoomIn(BaseModel):
    """Schema para crear aula"""
    name: str
    building: str
    capacity: int = 30
    has_wheelchair_access: bool = False
    has_visual_support: bool = False
    has_hearing_support: bool = False
    availabilities: list[RoomAvailabilityIn] | None = None


class TokenOut(BaseModel):
    """
    PROPÓSITO: Response del login - contiene JWT y datos del usuario
    Se retorna después de validar credenciales
    """
    access_token: str  # Token JWT a usar en Authorization header
    token_type: str = "bearer"
    user_type: str  # "student", "tutor", "admin"
    full_name: str = ""
    university_id: str = ""
    email: str = ""
    carrera: str | None = None


class UpdatePreferencesIn(BaseModel):
    """Schema para actualizar preferencias del usuario"""
    interest_subjects: list[str] | None = None  # ["Cálculo", "Física"]
    tutoring_preferences: dict | None = None  # {"morning": true, "afternoon": false}


class UpdateDisabilityIn(BaseModel):
    """Schema para actualizar información de discapacidad"""
    disability_type: str | None = None
    disability_description: str | None = None


class CreateTutoringSessionIn(BaseModel):
    """Schema para crear sesión de tutoría"""
    subject: str
    date_time: str  # ISO format: "2024-05-22T14:00"
    duration: int = 60  # Minutos
    spots: int = 5  # Cantidad máxima de estudiantes
    room: str | None = None
    accessibility_type: str | None = None  # "wheelchair,visual"
    recurrence_weeks: int = 0  # 0 = una sola sesión, N = repetir N semanas


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES: Operaciones comunes de registro
# ════════════════════════════════════════════════════════════════════════════════

def _commit_user(user, db: Session, role: str) -> dict:
    """
    PROPÓSITO: Confirma y guarda usuario en BD
    FLUJO: Commit → Refresh del objeto → Retorna datos del usuario
    Maneja excepciones y rollback si falla
    """
    try:
        db.commit()  # Confirma la transacción
        db.refresh(user)  # Recarga datos desde BD (obtiene ID autogenerado)
        print(f"[auth] Created {role} id={user.id} university_id={user.university_id}")
        return {"id": user.id, "university_id": user.university_id, "email": user.email,
                "full_name": user.full_name, "user_type": user.user_type}
    except Exception as e:
        db.rollback()  # Deshace cambios si hay error
        tb = traceback.format_exc()
        print(f"[auth] ERROR creating {role}:", e)
        return JSONResponse(status_code=500, content={"error": str(e), "trace": tb.splitlines()[-3:]})


def _save_user(payload: _BaseRegister, user_type: str, db: Session):
    """
    PROPÓSITO: Crea objeto User y lo añade a sesión (sin commit)
    
    FLUJO:
      1. Valida que no exista usuario con mismo university_id
      2. Valida que no exista usuario con mismo email
      3. Hash la contraseña
      4. Crea objeto User
      5. Lo añade a sesión
      
    NOTA: El caller es responsable de:
      - Crear registros de discapacidad si aplica
      - Llamar a _commit_user() para persistir cambios
    """
    print(f"[auth] Register attempt: university_id={payload.university_id}, email={payload.email}")

    # Verifica university_id único
    if db.query(User).filter(User.university_id == payload.university_id).first():
        raise HTTPException(status_code=400, detail="El número de identificación académica ya está registrado")

    # Verifica email único
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    # Hash contraseña con bcrypt
    hashed = hash_password(payload.password)
    
    # Crea objeto User (no guardado aún)
    user = User(
        university_id=payload.university_id,
        full_name=payload.full_name,
        email=payload.email.lower(),  # Normaliza a minúsculas
        hashed_password=hashed,
        user_type=user_type,
        carrera=payload.carrera,
    )
    db.add(user)  # Añade a sesión
    return user


@router.post("/register/student", response_model=dict, tags=["Autenticación"])
def register_student(payload: StudentRegisterIn, bg: BackgroundTasks, db: Session = Depends(get_db)):
    """Registro de estudiante. Campo disability_type = discapacidad que el estudiante tiene."""
    user = _save_user(payload, "student", db)

    if payload.disability_type != "ninguna":
        db.add(UserDisability(
            university_id=payload.university_id,
            disability_type=payload.disability_type,
            disability_description=payload.disability_description,
        ))
    result = _commit_user(user, db, "student")
    if isinstance(result, dict):
        bg.add_task(email_welcome, payload.email, payload.full_name, "student")
    return result


@router.post("/register/tutor", response_model=dict, tags=["Autenticación"])
def register_tutor(payload: TutorRegisterIn, bg: BackgroundTasks, db: Session = Depends(get_db)):
    """Registro de tutor. Campo disability_support_type = discapacidad que el tutor puede atender."""
    user = _save_user(payload, "tutor", db)

    if payload.disability_support_type != "ninguna":
        db.add(UserDisability(
            university_id=payload.university_id,
            disability_type=payload.disability_support_type,
            disability_description=payload.disability_support_description,
        ))
    result = _commit_user(user, db, "tutor")
    if isinstance(result, dict):
        bg.add_task(email_welcome, payload.email, payload.full_name, "tutor")
    return result


class LoginIn(BaseModel):
    university_id: str
    password: str


@router.post("/login", response_model=TokenOut, tags=["Autenticación"])
def login(payload: LoginIn, db: Session = Depends(get_db)):
    print(f"[auth] Login attempt with university_id: {payload.university_id}")
    
    user = db.query(User).filter(User.university_id == payload.university_id).first()
    if not user:
        print(f"[auth] login failed: user not found for university_id={payload.university_id}")
        # Mostrar todos los university_ids en la base de datos para debug
        all_users = db.query(User.university_id).all()
        print(f"[auth] Available university_ids in DB: {[u[0] for u in all_users]}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas - Usuario no encontrado")
    
    ok = verify_password(payload.password, user.hashed_password)
    print(f"[auth] login attempt for university_id={payload.university_id} -> user_id={user.id} password_ok={ok}")
    if not ok:
        raise HTTPException(status_code=401, detail="Credenciales inválidas - Contraseña incorrecta")
    token_data = {"sub": str(user.id), "university_id": user.university_id}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_type": user.user_type,
        "full_name": user.full_name,
        "university_id": user.university_id,
        "email": user.email,
        "carrera": user.carrera
    }


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password", tags=["Autenticación"])
def forgot_password(payload: ForgotPasswordIn, bg: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "Si el correo existe, recibirás un enlace de recuperación."}
    token = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(minutes=30)
    db.add(PasswordResetToken(user_id=user.id, token=token, expires_at=expires))
    db.commit()
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={token}"
    bg.add_task(email_password_reset, user.email, user.full_name, reset_url)
    return {"message": "Si el correo existe, recibirás un enlace de recuperación."}


@router.post("/reset-password", tags=["Autenticación"])
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == payload.token)
        .first()
    )
    if not record or record.used or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
    user.hashed_password = hash_password(payload.new_password)
    record.used = True
    db.commit()
    return {"message": "Contraseña actualizada correctamente."}


def get_user_preferences(db: Session, university_id: str):
    """Obtiene las preferencias del usuario desde las tablas separadas"""
    # Obtener materias de interés
    interest_subjects = db.query(InterestSubject).filter(
        InterestSubject.university_id == university_id
    ).all()
    subjects_list = [s.subject_name for s in interest_subjects]
    
    # Obtener preferencias de tutoría
    tutoring_prefs = db.query(TutoringPreference).filter(
        TutoringPreference.university_id == university_id
    ).all()
    preferences = {
        "morning": any(p.preference_type == "morning" and p.enabled for p in tutoring_prefs),
        "afternoon": any(p.preference_type == "afternoon" and p.enabled for p in tutoring_prefs),
        "evening": any(p.preference_type == "evening" and p.enabled for p in tutoring_prefs),
    }
    
    return subjects_list, preferences


@router.get("/me", tags=["Autenticación"])
def get_current_user(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Obtiene los datos del usuario actual basado en el token"""
    print(f"[auth] /me called with authorization: {authorization}")
    
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado - No hay token")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        university_id = payload.get("university_id")
        
        print(f"[auth] /me decoded user_id={user_id}, university_id={university_id}")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido - No hay user_id")
            
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Obtener preferencias desde tablas separadas
        subjects_list, preferences = get_user_preferences(db, university_id)
        
        # Obtener discapacidad
        disability = db.query(UserDisability).filter(UserDisability.university_id == university_id).first()
        
        return {
            "id": user.id,
            "university_id": user.university_id,
            "full_name": user.full_name,
            "email": user.email,
            "user_type": user.user_type,
            "carrera": user.carrera,
            "disability_type": disability.disability_type if disability else None,
            "disability_description": disability.disability_description if disability else None,
            "interest_subjects": subjects_list,
            "tutoring_preferences": preferences
        }
    except jwt.ExpiredSignatureError:
        print("[auth] /me Token expirado")
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError as e:
        print(f"[auth] /me JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        print("[auth] ERROR getting user:", e)
        raise HTTPException(status_code=401, detail=f"Error: {str(e)}")


@router.put("/preferences", tags=["Usuario / Perfil"])
def update_preferences(
    payload: UpdatePreferencesIn,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Actualiza las preferencias del usuario en tablas separadas"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        university_id = payload_jwt.get("university_id")
        
        if not university_id:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user = db.query(User).filter(User.university_id == university_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Actualizar materias de interés
        if payload.interest_subjects is not None:
            # Eliminar materias existentes
            db.query(InterestSubject).filter(InterestSubject.university_id == university_id).delete()
            # Agregar nuevas materias
            for subject_name in payload.interest_subjects:
                subject = InterestSubject(university_id=university_id, subject_name=subject_name)
                db.add(subject)
        
        # Actualizar preferencias de tutoría
        if payload.tutoring_preferences is not None:
            # Eliminar preferencias existentes
            db.query(TutoringPreference).filter(TutoringPreference.university_id == university_id).delete()
            # Agregar nuevas preferencias
            for pref_type, enabled in payload.tutoring_preferences.items():
                if enabled:  # Solo guardar las que están activas
                    pref = TutoringPreference(
                        university_id=university_id, 
                        preference_type=pref_type, 
                        enabled=True
                    )
                    db.add(pref)
        
        db.commit()
        
        # Obtener preferencias actualizadas
        subjects_list, preferences = get_user_preferences(db, university_id)
        
        return {
            "success": True,
            "interest_subjects": subjects_list,
            "tutoring_preferences": preferences
        }
    except Exception as e:
        db.rollback()
        print("[auth] ERROR updating preferences:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/disability", tags=["Usuario / Perfil"])
def update_disability(
    payload: UpdateDisabilityIn,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Actualiza la información de discapacidad del usuario"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        university_id = payload_jwt.get("university_id")
        
        if not university_id:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user = db.query(User).filter(User.university_id == university_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Buscar discapacidad existente
        disability = db.query(UserDisability).filter(UserDisability.university_id == university_id).first()
        
        if payload.disability_type is None or payload.disability_type == "none":
            # Eliminar discapacidad si existe
            if disability:
                db.delete(disability)
        else:
            # Crear o actualizar discapacidad
            if disability:
                disability.disability_type = payload.disability_type
                disability.disability_description = payload.disability_description
            else:
                disability = UserDisability(
                    university_id=university_id,
                    disability_type=payload.disability_type,
                    disability_description=payload.disability_description
                )
                db.add(disability)
        
        db.commit()
        
        # Obtener discapacidad actualizada
        disability = db.query(UserDisability).filter(UserDisability.university_id == university_id).first()
        
        return {
            "success": True,
            "disability_type": disability.disability_type if disability else None,
            "disability_description": disability.disability_description if disability else None
        }
    except Exception as e:
        db.rollback()
        print("[auth] ERROR updating disability:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/tutor/sessions", tags=["Tutorías"])
def create_tutoring_session(
    payload: CreateTutoringSessionIn,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload_jwt.get("sub")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or user.user_type != "tutor":
            raise HTTPException(status_code=403, detail="Solo los tutores pueden crear sesiones")
        
        # Parse date
        try:
            dt = datetime.fromisoformat(payload.date_time.replace('Z', '+00:00'))
        except:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")

        weeks = max(0, min(payload.recurrence_weeks, 51))  # cap at 1 year
        created_ids = []
        for w in range(weeks + 1):
            session = TutoringSession(
                tutor_id=user.id,
                subject=payload.subject,
                date_time=dt + timedelta(weeks=w),
                duration=payload.duration,
                spots=payload.spots,
                spots_available=payload.spots,
                room=payload.room,
                accessibility_type=payload.accessibility_type,
            )
            db.add(session)
            db.flush()
            created_ids.append(session.id)
        db.commit()

        return {"success": True, "session_id": created_ids[0], "created": len(created_ids)}
    except Exception as e:
        db.rollback()
        print("[auth] ERROR creating session:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/tutor/sessions", tags=["Tutorías"])
def get_tutor_sessions(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload_jwt.get("sub")
        
        sessions = db.query(TutoringSession).filter(TutoringSession.tutor_id == int(user_id)).all()
        
        return [
            {
                "id": s.id,
                "subject": s.subject,
                "date_time": s.date_time.isoformat(),
                "duration": s.duration,
                "spots": s.spots,
                "spots_available": s.spots_available,
                "room": s.room,
                "accessibility_type": s.accessibility_type
            } for s in sessions
        ]
    except Exception as e:
        print("[auth] ERROR getting sessions:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/tutor/sessions/{session_id}/students", tags=["Tutorías"])
def get_session_students(
    session_id: int,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Obtiene los estudiantes inscritos en una sesión específica de un tutor"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        from models import TutoringEnrollment, User
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))
        
        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session or session.tutor_id != user_id:
            raise HTTPException(status_code=403, detail="No autorizado para ver esta sesión")
            
        enrollments = db.query(TutoringEnrollment).filter(TutoringEnrollment.session_id == session_id).all()
        student_ids = [e.student_id for e in enrollments]
        
        if not student_ids:
            return []
            
        students = db.query(User).filter(User.id.in_(student_ids)).all()
        
        return [
            {
                "id": s.id,
                "full_name": s.full_name,
                "email": s.email,
                "carrera": s.carrera
            } for s in students
        ]
    except HTTPException:
        raise
    except Exception as e:
        print("[auth] ERROR getting session students:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", tags=["Tutorías"])
def get_all_sessions(
    db: Session = Depends(get_db)
):
    """Retorna todas las sesiones de tutoría disponibles"""
    try:
        # Filtrar por fecha >= hoy
        sessions = db.query(TutoringSession).filter(TutoringSession.date_time >= datetime.now()).all()
        
        result = []
        for s in sessions:
            tutor = db.query(User).filter(User.id == s.tutor_id).first()
            result.append({
                "id": s.id,
                "subject": s.subject,
                "date_time": s.date_time.isoformat(),
                "duration": s.duration,
                "spots": s.spots,
                "spots_available": s.spots_available,
                "room": s.room,
                "tutor_name": tutor.full_name if tutor else "Tutor Desconocido",
                "accessibility_type": s.accessibility_type
            })

        return result
    except Exception as e:
        print("[auth] ERROR getting all sessions:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
@router.post("/sessions/{session_id}/enroll", tags=["Tutorías"])
def enroll_session(
    session_id: int,
    bg: BackgroundTasks,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Inscribe a un estudiante en una tutoría"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        # Lock the session row to prevent concurrent overbooking
        tutoring_session = (
            db.query(TutoringSession)
            .filter(TutoringSession.id == session_id)
            .with_for_update()
            .first()
        )
        if not tutoring_session:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")

        existing = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya estás inscrito en esta tutoría")

        if tutoring_session.spots_available <= 0:
            raise HTTPException(status_code=400, detail="No hay cupos disponibles")

        # Overlap check: reject if student has another session that overlaps in time
        new_start = tutoring_session.date_time
        new_end   = new_start + timedelta(minutes=tutoring_session.duration)
        other_enrollments = (
            db.query(TutoringEnrollment)
            .filter(TutoringEnrollment.student_id == user_id)
            .all()
        )
        for enr in other_enrollments:
            s = enr.session
            if not s:
                continue
            s_start = s.date_time
            s_end   = s_start + timedelta(minutes=s.duration)
            if new_start < s_end and new_end > s_start:
                raise HTTPException(
                    status_code=409,
                    detail=f"Tienes un solapamiento con la tutoría de {s.subject} ({s_start.strftime('%H:%M')} – {s_end.strftime('%H:%M')})"
                )

        student = db.query(User).filter(User.id == user_id).first()
        tutor   = db.query(User).filter(User.id == tutoring_session.tutor_id).first()

        enrollment = TutoringEnrollment(student_id=user_id, session_id=session_id)
        tutoring_session.spots_available -= 1
        db.add(enrollment)
        db.commit()

        if student:
            dt = tutoring_session.date_time
            bg.add_task(
                email_enrollment_confirmation,
                student.email,
                student.full_name,
                tutoring_session.subject,
                tutor.full_name if tutor else "Tutor",
                dt.strftime("%d/%m/%Y"),
                dt.strftime("%H:%M"),
                tutoring_session.room,
                tutoring_session.duration,
            )

        return {"success": True, "message": "Inscripción exitosa"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("[auth] ERROR enrolling student:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/enrolled-sessions", tags=["Tutorías"])
def get_enrolled_sessions(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Retorna las sesiones en las que el estudiante está inscrito"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))
        
        enrollments = (
            db.query(TutoringEnrollment)
            .filter(TutoringEnrollment.student_id == user_id)
            .options(joinedload(TutoringEnrollment.session).joinedload(TutoringSession.tutor))
            .all()
        )

        now = datetime.now()
        result = []
        for e in enrollments:
            s = e.session
            if not s:
                continue
            if s.date_time + timedelta(minutes=s.duration) < now:
                continue
            result.append({
                "id": s.id,
                "subject": s.subject,
                "date_time": s.date_time.isoformat(),
                "duration": s.duration,
                "room": s.room,
                "tutor_name": s.tutor.full_name if s.tutor else "Tutor Desconocido",
            })

        return result
    except Exception as e:
        print("[auth] ERROR getting enrolled sessions:", e)
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/sessions/{session_id}/enroll", tags=["Tutorías"])
def cancel_enrollment(
    session_id: int,
    bg: BackgroundTasks,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Cancela la inscripción de un estudiante en una tutoría"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        enrollment = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")

        tutoring_session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        student = db.query(User).filter(User.id == user_id).first()

        if tutoring_session:
            tutoring_session.spots_available += 1
        db.delete(enrollment)
        db.commit()

        if student and tutoring_session:
            dt = tutoring_session.date_time
            bg.add_task(
                email_enrollment_cancelled,
                student.email,
                student.full_name,
                tutoring_session.subject,
                dt.strftime("%d/%m/%Y"),
                dt.strftime("%H:%M"),
            )
            # Notify first waitlist entry
            first_wait = (
                db.query(WaitlistEntry)
                .filter(WaitlistEntry.session_id == session_id, WaitlistEntry.notified == False)
                .order_by(WaitlistEntry.position)
                .first()
            )
            if first_wait:
                wait_student = db.query(User).filter(User.id == first_wait.student_id).first()
                if wait_student:
                    first_wait.notified = True
                    db.commit()
                    bg.add_task(
                        email_waitlist_spot_available,
                        wait_student.email,
                        wait_student.full_name,
                        tutoring_session.subject,
                        dt.strftime("%d/%m/%Y"),
                        dt.strftime("%H:%M"),
                    )

        return {"success": True, "message": "Inscripción cancelada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("[auth] ERROR cancelling enrollment:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/waitlist", tags=["Tutorías"])
def join_waitlist(
    session_id: int,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Añade al estudiante a la lista de espera de una sesión llena"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")

        already_enrolled = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        if already_enrolled:
            raise HTTPException(status_code=400, detail="Ya estás inscrito en esta tutoría")

        already_waiting = db.query(WaitlistEntry).filter(
            WaitlistEntry.student_id == user_id,
            WaitlistEntry.session_id == session_id
        ).first()
        if already_waiting:
            raise HTTPException(status_code=400, detail="Ya estás en la lista de espera")

        last_pos = db.query(func.max(WaitlistEntry.position)).filter(
            WaitlistEntry.session_id == session_id
        ).scalar() or 0
        db.add(WaitlistEntry(student_id=user_id, session_id=session_id, position=last_pos + 1))
        db.commit()
        return {"success": True, "position": last_pos + 1}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}/waitlist", tags=["Tutorías"])
def leave_waitlist(
    session_id: int,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Elimina al estudiante de la lista de espera"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        entry = db.query(WaitlistEntry).filter(
            WaitlistEntry.student_id == user_id,
            WaitlistEntry.session_id == session_id
        ).first()
        if not entry:
            raise HTTPException(status_code=404, detail="No estás en la lista de espera")
        db.delete(entry)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/waitlist", tags=["Estudiantes"])
def get_student_waitlist(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Retorna las sesiones en lista de espera del estudiante"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        entries = (
            db.query(WaitlistEntry)
            .filter(WaitlistEntry.student_id == user_id)
            .order_by(WaitlistEntry.session_id)
            .all()
        )
        return [
            {
                "session_id": e.session_id,
                "position": e.position,
                "subject": e.session.subject if e.session else "",
                "date_time": e.session.date_time.isoformat() if e.session else "",
            }
            for e in entries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RateSessionIn(BaseModel):
    stars: int
    comment: str = ""


@router.post("/sessions/{session_id}/rate", tags=["Tutorías"])
def rate_session(
    session_id: int,
    payload: RateSessionIn,
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Permite a un estudiante valorar una sesión ya finalizada (1-5 estrellas)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=422, detail="Las estrellas deben estar entre 1 y 5")
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))

        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        if session.date_time > datetime.utcnow():
            raise HTTPException(status_code=400, detail="Solo puedes valorar sesiones ya finalizadas")

        enrollment = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="No estuviste inscrito en esta sesión")

        existing = db.query(TutorRating).filter(
            TutorRating.student_id == user_id,
            TutorRating.session_id == session_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya valoraste esta sesión")

        db.add(TutorRating(
            student_id=user_id,
            tutor_id=session.tutor_id,
            session_id=session_id,
            stars=payload.stars,
            comment=payload.comment.strip() or None,
        ))
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tutor/{tutor_id}/ratings", tags=["Tutores"])
def get_tutor_ratings(tutor_id: int, db: Session = Depends(get_db)):
    """Retorna valoraciones y promedio de un tutor"""
    ratings = db.query(TutorRating).filter(TutorRating.tutor_id == tutor_id).all()
    if not ratings:
        return {"average": 0, "count": 0, "reviews": []}
    avg = sum(r.stars for r in ratings) / len(ratings)
    reviews = [
        {
            "stars": r.stars,
            "comment": r.comment,
            "student_name": r.student.full_name if r.student else "Estudiante",
            "date": r.created_at.strftime("%d/%m/%Y") if r.created_at else "",
        }
        for r in sorted(ratings, key=lambda x: x.created_at or datetime.min, reverse=True)[:20]
    ]
    return {"average": round(avg, 1), "count": len(ratings), "reviews": reviews}


@router.get("/student/my-ratings", tags=["Estudiantes"])
def get_my_ratings(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Retorna los session_id que el estudiante ya valoró"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))
        rated = db.query(TutorRating.session_id).filter(TutorRating.student_id == user_id).all()
        return [r[0] for r in rated]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/notifications", tags=["Estudiantes"])
def get_student_notifications(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Genera notificaciones dinámicas basadas en la actividad del estudiante"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        from datetime import datetime
        token = authorization.replace("Bearer ", "")
        payload_jwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload_jwt.get("sub"))
        
        enrollments = db.query(TutoringEnrollment).filter(TutoringEnrollment.student_id == user_id).all()
        
        notifications = []
        now = datetime.now()
        
        for e in enrollments:
            s = e.session
            
            # Recordatorio si es dentro de las próximas 24 horas
            if s.date_time > now and (s.date_time - now).total_seconds() < 86400:
                hours_left = int((s.date_time - now).total_seconds() // 3600)
                time_str = f"En {hours_left} horas" if hours_left > 0 else "¡En menos de una hora!"
                notifications.append({
                    "id": f"rem_{s.id}",
                    "type": "reminder",
                    "title": "Tutoría Próxima",
                    "message": f"Tu tutoría de {s.subject} es pronto en {s.room or 'sala por definir'}.",
                    "time": time_str
                })
        
        if not enrollments:
            notifications.append({
                "id": "welcome_1",
                "type": "recommendation",
                "title": "¡Bienvenido a PITA!",
                "message": "Explora los salones o inscríbete en tu primera tutoría.",
                "time": "Recién"
            })

        return notifications
    except Exception as e:
        print("[auth] ERROR getting notifications:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms", tags=["Salones"])
def get_public_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "building": r.building,
            "capacity": r.capacity,
            "available": r.available,
            "has_wheelchair_access": r.accessibility_wheelchair,
            "has_visual_support": r.accessibility_visual,
            "has_hearing_support": r.accessibility_hearing,
            "availabilities": [
                {
                    "day": av.day, 
                    "specific_date": av.specific_date.isoformat() if av.specific_date else None,
                    "start_time": av.start_time, 
                    "end_time": av.end_time
                }
                for av in r.availabilities
            ]
        } for r in rooms
    ]

@router.get("/rooms/available", tags=["Salones"])
def get_available_rooms(
    date: str, # YYYY-MM-DD
    time: str, # HH:MM
    duration: int = 60,
    db: Session = Depends(get_db)
):
    """
    Retorna salones disponibles para un día y hora específicos.
    Un salón es disponible si:
    1. Está marcado como disponible globalmente (Room.available = True).
    2. SI tiene un horario maestro definido, el intervalo debe caber en él.
    3. SI NO tiene horario maestro definido, se considera disponible por defecto.
    4. NO tiene ninguna sesión de tutoría que traslape en ese horario.
    """
    try:
        # req_start is local time from frontend
        req_start = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        req_end = req_start + timedelta(minutes=duration)
        
        # Day name in Spanish (CamelCase to match AdminPanel)
        days_map = {0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}
        day_name = days_map[req_start.weekday()]
        
        req_start_str = req_start.strftime("%H:%M")
        req_end_str = req_end.strftime("%H:%M")

        # 1. Obtener todos los salones marcados como disponibles
        rooms = db.query(Room).filter(Room.available == True).all()
        available_rooms = []

        for r in rooms:
            # 2. Verificar Horario Maestro (Admin)
            if not r.availabilities:
                # Si no hay reglas de horario, está abierto por defecto (retrocompatibilidad)
                has_admin_permission = True
            else:
                # Si hay reglas, debe cumplir al menos una
                has_admin_permission = False
                for av in r.availabilities:
                    matches_day = (av.day == day_name)
                    matches_date = (av.specific_date == req_start.date())
                    if matches_day or matches_date:
                        # Comparación de strings HH:MM funciona para rangos
                        if av.start_time <= req_start_str and av.end_time >= req_end_str:
                            has_admin_permission = True
                            break
            
            if not has_admin_permission:
                continue

            # 3. Verificar Traslapes con otras Tutorías
            # Buscamos sesiones en este mismo salón para el mismo día
            # (Simplificación: buscamos por nombre de salón)
            existing_sessions = db.query(TutoringSession).filter(
                TutoringSession.room == r.name,
                # Filtro grueso por fecha para eficiencia (asumiendo sesiones no cruzan medianoche usualmente)
                func.date(TutoringSession.date_time) == req_start.date()
            ).all()

            has_conflict = False
            for s in existing_sessions:
                s_start = s.date_time
                s_end = s_start + timedelta(minutes=s.duration)
                
                # Overlap logic: (StartA < EndB) and (EndA > StartB)
                if (req_start < s_end) and (req_end > s_start):
                    has_conflict = True
                    break
            
            if not has_conflict:
                available_rooms.append({
                    "id": r.id, 
                    "name": r.name, 
                    "building": r.building, 
                    "capacity": r.capacity,
                    "availabilities": [
                        {
                            "day": av.day, 
                            "specific_date": av.specific_date.isoformat() if av.specific_date else None,
                            "start_time": av.start_time, 
                            "end_time": av.end_time
                        }
                        for av in r.availabilities
                    ]
                })
        
        return available_rooms
    except Exception as e:
        print("[rooms] ERROR checking availability:", e)
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error en datos: {str(e)}")

# --- ADMIN ENDPOINTS ---

@router.get("/admin/users", tags=["Administración"])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "university_id": u.university_id, "full_name": u.full_name, "email": u.email, "user_type": u.user_type, "carrera": u.carrera} for u in users]

@router.delete("/admin/users/{user_id}", tags=["Administración"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.university_id == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar al administrador principal")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}

@router.get("/admin/sessions", tags=["Administración"])
def get_all_sessions_admin(db: Session = Depends(get_db)):
    sessions = db.query(TutoringSession).all()
    return [{
        "id": s.id,
        "subject": s.subject,
        "tutor_name": s.tutor.full_name if s.tutor else "Unknown",
        "date_time": s.date_time.isoformat(),
        "spots": s.spots,
        "spots_available": s.spots_available,
        "room": s.room
    } for s in sessions]

@router.delete("/admin/sessions/{session_id}", tags=["Administración"])
def delete_session(session_id: int, bg: BackgroundTasks, db: Session = Depends(get_db)):
    session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    # Collect enrolled students before deletion for notification
    enrollments = db.query(TutoringEnrollment).filter(TutoringEnrollment.session_id == session_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).all() if student_ids else []
    dt = session.date_time
    subject_name = session.subject
    date_str = dt.strftime("%d/%m/%Y")
    time_str  = dt.strftime("%H:%M")

    db.delete(session)
    db.commit()

    for s in students:
        bg.add_task(email_session_cancelled_by_tutor, s.email, s.full_name, subject_name, date_str, time_str)

    return {"message": "Sesión eliminada"}

@router.get("/admin/rooms", tags=["Administración"])
def get_rooms_admin(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "building": r.building,
            "capacity": r.capacity,
            "available": r.available,
            "has_wheelchair_access": r.accessibility_wheelchair,
            "has_visual_support": r.accessibility_visual,
            "has_hearing_support": r.accessibility_hearing,
            "availabilities": [
                {
                    "day": av.day, 
                    "specific_date": av.specific_date.isoformat() if av.specific_date else None,
                    "start_time": av.start_time, 
                    "end_time": av.end_time
                }
                for av in r.availabilities
            ]
        } for r in rooms
    ]

@router.post("/admin/rooms", tags=["Administración"])
def create_room(payload: RoomIn, db: Session = Depends(get_db)):
    # Nomenclature: Block-Name (e.g. L-21)
    block_letter = payload.building.replace("Bloque ", "")
    full_name_formatted = f"{block_letter}-{payload.name}"
    
    room = Room(
        name=full_name_formatted,
        building=payload.building,
        capacity=payload.capacity,
        accessibility_wheelchair=payload.has_wheelchair_access,
        accessibility_visual=payload.has_visual_support,
        accessibility_hearing=payload.has_hearing_support
    )
    db.add(room)
    try:
        db.flush() # To get room.id
        
        # Save availabilities
        if payload.availabilities:
            for av in payload.availabilities:
                s_date = None
                if av.specific_date:
                    try:
                        s_date = datetime.strptime(av.specific_date, "%Y-%m-%d").date()
                    except: pass

                db.add(RoomAvailability(
                    room_id=room.id,
                    day=av.day,
                    specific_date=s_date,
                    start_time=av.start_time,
                    end_time=av.end_time
                ))
        
        db.commit()
        db.refresh(room)
        return room
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear salón: {str(e)}")

@router.delete("/admin/rooms/{room_id}", tags=["Administración"])
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    db.delete(room)
    db.commit()
    return {"message": "Salón eliminado"}

@router.get("/admin/users/{user_id}/detail", tags=["Administración"])
def get_user_detail_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 1. Base Info
    res = {
        "id": user.id,
        "university_id": user.university_id,
        "full_name": user.full_name,
        "email": user.email,
        "user_type": user.user_type,
        "carrera": user.carrera,
        "created_at": user.created_at.isoformat(),
        "disability": None,
        "history": []
    }

    # 2. Disability info
    if user.disability:
        res["disability"] = {
            "type": user.disability.disability_type,
            "description": user.disability.disability_description
        }

    # 3. History
    if user.user_type == "tutor":
        # Sessions created by tutor
        sessions = db.query(TutoringSession).filter(TutoringSession.tutor_id == user_id).all()
        for s in sessions:
            res["history"].append({
                "type": "created",
                "id": s.id,
                "subject": s.subject,
                "date_time": s.date_time.isoformat(),
                "room": s.room,
                "spots": s.spots,
                "spots_available": s.spots_available
            })
    else:
        # Enrollments by student
        enrollments = db.query(TutoringEnrollment).filter(TutoringEnrollment.student_id == user_id).all()
        for e in enrollments:
            s = e.session
            if s:
                res["history"].append({
                    "type": "enrolled",
                    "id": s.id,
                    "subject": s.subject,
                    "date_time": s.date_time.isoformat(),
                    "room": s.room,
                    "tutor_name": s.tutor.full_name if s.tutor else "Unknown"
                })
    
    return res
