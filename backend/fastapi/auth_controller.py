from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db import SessionLocal, init_db
from models import User, InterestSubject, TutoringPreference, UserDisability, TutoringSession, TutoringEnrollment
import bcrypt
import traceback
from fastapi.responses import JSONResponse
import os
from jose import jwt
from dotenv import load_dotenv
from typing import Literal
from datetime import datetime

load_dotenv()
SECRET_KEY = os.getenv("XOsFw_ir9cwCC-liLKURVCFUPPKc7BOYzytN-CvurYA", "please-change-me")
ALGORITHM = "HS256"

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterIn(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    university_id: str
    carrera: str | None = None
    user_type: Literal["student", "tutor", "admin"] = "student"
    disability_type: str | None = None
    disability_description: str | None = None


class RoomIn(BaseModel):
    name: str
    building: str
    capacity: int = 30
    accessibility_wheelchair: bool = False
    accessibility_visual: bool = False
    accessibility_hearing: bool = False


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = "student"
    full_name: str = ""
    university_id: str = ""
    email: str = ""
    carrera: str | None = None


class UpdatePreferencesIn(BaseModel):
    interest_subjects: list[str] | None = None
    tutoring_preferences: dict | None = None


class UpdateDisabilityIn(BaseModel):
    disability_type: str | None = None
    disability_description: str | None = None


class CreateTutoringSessionIn(BaseModel):
    subject: str
    date_time: str # ISO string
    duration: int = 60
    spots: int = 5
    room: str | None = None
    accessibility_type: str | None = None


@router.post("/register", response_model=dict)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    print(f"[auth] Register attempt: university_id={payload.university_id}, email={payload.email}")
    
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    existing_student = db.query(User).filter(User.university_id == payload.university_id).first()
    if existing_student:
        print(f"[auth] Register failed: university_id {payload.university_id} already exists")
        raise HTTPException(status_code=400, detail="El número de identificación académica ya está registrado")
    
    # Verificar email único
    existing_email = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_email:
        print(f"[auth] Register failed: email {payload.email} already exists")
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed = hash_password(payload.password)
    user = User(
        university_id=payload.university_id,
        full_name=payload.full_name, 
        email=payload.email.lower(), 
        hashed_password=hashed, 
        user_type=payload.user_type, 
        carrera=payload.carrera
    )
    db.add(user)
    
    # Agregar discapacidad si existe
    if payload.disability_type and payload.disability_type != "none":
        disability = UserDisability(
            university_id=payload.university_id,
            disability_type=payload.disability_type,
            disability_description=payload.disability_description
        )
        db.add(disability)
    
    try:
        db.commit()
        db.refresh(user)
        print(f"[auth] Created user id={user.id} university_id={user.university_id} email={user.email}")
        return {"id": user.id, "university_id": user.university_id, "email": user.email, "full_name": user.full_name, "user_type": user.user_type}
    except Exception as e:
        db.rollback()
        tb = traceback.format_exc()
        print("[auth] ERROR creating user:", e)
        print(tb)
        return JSONResponse(status_code=500, content={"error": str(e), "trace": tb.splitlines()[-3:]})


class LoginIn(BaseModel):
    university_id: str
    password: str


@router.post("/login", response_model=TokenOut)
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


@router.get("/me")
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


@router.put("/preferences")
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


@router.put("/disability")
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


@router.post("/tutor/sessions")
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

        session = TutoringSession(
            tutor_id=user.id,
            subject=payload.subject,
            date_time=dt,
            duration=payload.duration,
            spots=payload.spots,
            spots_available=payload.spots,
            room=payload.room,
            accessibility_type=payload.accessibility_type
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {"success": True, "session_id": session.id}
    except Exception as e:
        db.rollback()
        print("[auth] ERROR creating session:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/tutor/sessions")
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
@router.get("/sessions")
def get_all_sessions(
    db: Session = Depends(get_db)
):
    """Retorna todas las sesiones de tutoría disponibles"""
    try:
        # Podríamos filtrar por fecha >= hoy en el futuro
        sessions = db.query(TutoringSession).all()
        
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
                "tutor_name": tutor.full_name if tutor else "Tutor Desconocido"
            })
        
        return result
    except Exception as e:
        print("[auth] ERROR getting all sessions:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
@router.post("/sessions/{session_id}/enroll")
def enroll_session(
    session_id: int,
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
        
        # 1. Verificar si la sesión existe
        tutoring_session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not tutoring_session:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")
        
        # 2. Verificar si ya está inscrito
        existing = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya estás inscrito en esta tutoría")
            
        # 3. Verificar cupos
        if tutoring_session.spots_available <= 0:
            raise HTTPException(status_code=400, detail="No hay cupos disponibles")
            
        # 4. Inscribir y restar cupo
        enrollment = TutoringEnrollment(student_id=user_id, session_id=session_id)
        tutoring_session.spots_available -= 1
        
        db.add(enrollment)
        db.commit()
        
        return {"success": True, "message": "Inscripción exitosa"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("[auth] ERROR enrolling student:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/enrolled-sessions")
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
        
        enrollments = db.query(TutoringEnrollment).filter(TutoringEnrollment.student_id == user_id).all()
        
        result = []
        for e in enrollments:
            s = e.session
            tutor = db.query(User).filter(User.id == s.tutor_id).first()
            result.append({
                "id": s.id,
                "subject": s.subject,
                "date_time": s.date_time.isoformat(),
                "duration": s.duration,
                "room": s.room,
                "tutor_name": tutor.full_name if tutor else "Tutor Desconocido"
            })
            
        return result
    except Exception as e:
        print("[auth] ERROR getting enrolled sessions:", e)
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/sessions/{session_id}/enroll")
def cancel_enrollment(
    session_id: int,
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
        
        # 1. Buscar la inscripción
        enrollment = db.query(TutoringEnrollment).filter(
            TutoringEnrollment.student_id == user_id,
            TutoringEnrollment.session_id == session_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
            
        # 2. Restaurar cupo
        tutoring_session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if tutoring_session:
            tutoring_session.spots_available += 1
            
        # 3. Eliminar inscripción
        db.delete(enrollment)
        db.commit()
        
        return {"success": True, "message": "Inscripción cancelada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("[auth] ERROR cancelling enrollment:", e)
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN ENDPOINTS ---

@router.get("/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "university_id": u.university_id, "full_name": u.full_name, "email": u.email, "user_type": u.user_type, "carrera": u.carrera} for u in users]

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.university_id == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar al administrador principal")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}

@router.get("/admin/sessions")
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

@router.delete("/admin/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    db.delete(session)
    db.commit()
    return {"message": "Sesión eliminada"}

@router.get("/admin/rooms")
def get_rooms_admin(db: Session = Depends(get_db)):
    from models import Room
    return db.query(Room).all()

@router.post("/admin/rooms")
def create_room(payload: RoomIn, db: Session = Depends(get_db)):
    from models import Room
    room = Room(
        name=payload.name,
        building=payload.building,
        capacity=payload.capacity,
        accessibility_wheelchair=payload.accessibility_wheelchair,
        accessibility_visual=payload.accessibility_visual,
        accessibility_hearing=payload.accessibility_hearing
    )
    db.add(room)
    try:
        db.commit()
        db.refresh(room)
        return room
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear salón (posible nombre duplicado)")

@router.delete("/admin/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    from models import Room
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    db.delete(room)
    db.commit()
    return {"message": "Salón eliminado"}
