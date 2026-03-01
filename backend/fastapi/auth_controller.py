from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db import SessionLocal, init_db
from models import User, InterestSubject, TutoringPreference, UserDisability
import bcrypt
import traceback
from fastapi.responses import JSONResponse
import os
from jose import jwt
from dotenv import load_dotenv

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
    student_id: str
    carrera: str | None = None
    user_type: str = "student"
    disability_type: str | None = None
    disability_description: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = "student"
    full_name: str = ""
    student_id: str = ""
    email: str = ""
    carrera: str | None = None


class UpdatePreferencesIn(BaseModel):
    interest_subjects: list[str] | None = None
    tutoring_preferences: dict | None = None


class UpdateDisabilityIn(BaseModel):
    disability_type: str | None = None
    disability_description: str | None = None


@router.post("/register", response_model=dict)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    print(f"[auth] Register attempt: student_id={payload.student_id}, email={payload.email}")
    
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    # Verificar student_id único
    existing_student = db.query(User).filter(User.student_id == payload.student_id).first()
    if existing_student:
        print(f"[auth] Register failed: student_id {payload.student_id} already exists")
        raise HTTPException(status_code=400, detail="El número de estudiante ya está registrado")
    
    # Verificar email único
    existing_email = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_email:
        print(f"[auth] Register failed: email {payload.email} already exists")
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed = hash_password(payload.password)
    user = User(
        student_id=payload.student_id,
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
            student_id=payload.student_id,
            disability_type=payload.disability_type,
            disability_description=payload.disability_description
        )
        db.add(disability)
    
    try:
        db.commit()
        db.refresh(user)
        print(f"[auth] Created user id={user.id} student_id={user.student_id} email={user.email}")
        return {"id": user.id, "student_id": user.student_id, "email": user.email, "full_name": user.full_name, "user_type": user.user_type}
    except Exception as e:
        db.rollback()
        tb = traceback.format_exc()
        print("[auth] ERROR creating user:", e)
        print(tb)
        return JSONResponse(status_code=500, content={"error": str(e), "trace": tb.splitlines()[-3:]})


class LoginIn(BaseModel):
    student_id: str
    password: str


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    print(f"[auth] Login attempt with student_id: {payload.student_id}")
    
    user = db.query(User).filter(User.student_id == payload.student_id).first()
    if not user:
        print(f"[auth] login failed: user not found for student_id={payload.student_id}")
        # Mostrar todos los student_ids en la base de datos para debug
        all_users = db.query(User.student_id).all()
        print(f"[auth] Available student_ids in DB: {[u[0] for u in all_users]}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas - Usuario no encontrado")
    
    ok = verify_password(payload.password, user.hashed_password)
    print(f"[auth] login attempt for student_id={payload.student_id} -> user_id={user.id} password_ok={ok}")
    if not ok:
        raise HTTPException(status_code=401, detail="Credenciales inválidas - Contraseña incorrecta")
    token_data = {"sub": str(user.id), "student_id": user.student_id}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_type": user.user_type,
        "full_name": user.full_name,
        "student_id": user.student_id,
        "email": user.email,
        "carrera": user.carrera
    }


def get_user_preferences(db: Session, student_id: str):
    """Obtiene las preferencias del usuario desde las tablas separadas"""
    # Obtener materias de interés
    interest_subjects = db.query(InterestSubject).filter(
        InterestSubject.student_id == student_id
    ).all()
    subjects_list = [s.subject_name for s in interest_subjects]
    
    # Obtener preferencias de tutoría
    tutoring_prefs = db.query(TutoringPreference).filter(
        TutoringPreference.student_id == student_id
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
        student_id = payload.get("student_id")
        
        print(f"[auth] /me decoded user_id={user_id}, student_id={student_id}")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido - No hay user_id")
            
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Obtener preferencias desde tablas separadas
        subjects_list, preferences = get_user_preferences(db, student_id)
        
        # Obtener discapacidad
        disability = db.query(UserDisability).filter(UserDisability.student_id == student_id).first()
        
        return {
            "id": user.id,
            "student_id": user.student_id,
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
        student_id = payload_jwt.get("student_id")
        
        if not student_id:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user = db.query(User).filter(User.student_id == student_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Actualizar materias de interés
        if payload.interest_subjects is not None:
            # Eliminar materias existentes
            db.query(InterestSubject).filter(InterestSubject.student_id == student_id).delete()
            # Agregar nuevas materias
            for subject_name in payload.interest_subjects:
                subject = InterestSubject(student_id=student_id, subject_name=subject_name)
                db.add(subject)
        
        # Actualizar preferencias de tutoría
        if payload.tutoring_preferences is not None:
            # Eliminar preferencias existentes
            db.query(TutoringPreference).filter(TutoringPreference.student_id == student_id).delete()
            # Agregar nuevas preferencias
            for pref_type, enabled in payload.tutoring_preferences.items():
                if enabled:  # Solo guardar las que están activas
                    pref = TutoringPreference(
                        student_id=student_id, 
                        preference_type=pref_type, 
                        enabled=True
                    )
                    db.add(pref)
        
        db.commit()
        
        # Obtener preferencias actualizadas
        subjects_list, preferences = get_user_preferences(db, student_id)
        
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
        student_id = payload_jwt.get("student_id")
        
        if not student_id:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user = db.query(User).filter(User.student_id == student_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Buscar discapacidad existente
        disability = db.query(UserDisability).filter(UserDisability.student_id == student_id).first()
        
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
                    student_id=student_id,
                    disability_type=payload.disability_type,
                    disability_description=payload.disability_description
                )
                db.add(disability)
        
        db.commit()
        
        # Obtener discapacidad actualizada
        disability = db.query(UserDisability).filter(UserDisability.student_id == student_id).first()
        
        return {
            "success": True,
            "disability_type": disability.disability_type if disability else None,
            "disability_description": disability.disability_description if disability else None
        }
    except Exception as e:
        db.rollback()
        print("[auth] ERROR updating disability:", e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
