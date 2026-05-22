"""
╔════════════════════════════════════════════════════════════════════════════════╗
║                    MODELOS DE BASE DE DATOS - FastAPI                         ║
║                         SQLAlchemy ORM Models                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Define todas las tablas y relaciones de la base de datos usando SQLAlchemy ORM.
  Cada clase representa una tabla en MySQL.

TABLAS PRINCIPALES:
  1. User: Usuarios (estudiantes, tutores, administradores)
  2. InterestSubject: Materias de interés de estudiantes
  3. TutoringPreference: Preferencias de horario (mañana, tarde, noche)
  4. UserDisability: Discapacidades o necesidades de accesibilidad
  5. TutoringSession: Sesiones de tutoría ofrecidas por tutores
  6. TutoringEnrollment: Inscripciones de estudiantes en sesiones
  7. TutorRating: Calificaciones de tutores por estudiantes
  8. WaitlistEntry: Lista de espera para sesiones llenas
  9. Room: Aulas de la universidad
  10. RoomAvailability: Disponibilidad de aulas por día y hora
  11. PasswordResetToken: Tokens para recuperación de contraseña

FLUJO DE DATOS:
  Usuario se registra → Se crea User → Selecciona materias → InterestSubjects
  → Tutor crea sesión → TutoringSession → Estudiantes se inscriben → TutoringEnrollment
  → Sesión ocurre → Estudiante califica tutor → TutorRating
"""

from sqlalchemy import Column, Integer, String, DateTime, Date, func, Text, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base

# ════════════════════════════════════════════════════════════════════════════════
# MODELO: User (Tabla de Usuarios)
# ════════════════════════════════════════════════════════════════════════════════

class User(Base):
    """
    PROPÓSITO: Tabla principal que almacena todos los usuarios (estudiantes, tutores)
    
    CAMPOS:
      - id: Identificador único (clave primaria)
      - university_id: Código de estudiante/tutor (único, usado en login)
      - full_name: Nombre completo del usuario
      - email: Correo electrónico (único)
      - hashed_password: Contraseña hasheada con bcrypt (nunca almacenar en texto plano)
      - user_type: Tipo de usuario ("student", "tutor", "admin")
      - carrera: Carrera académica del usuario
      - created_at: Fecha/hora de creación de cuenta (auto-asignada)
      
    RELACIONES:
      - interest_subjects: Materias que estudia/enseña
      - tutoring_preferences: Preferencias de horario
      - disability: Necesidades de accesibilidad
      - sessions: Sesiones de tutoría creadas (solo tutores)
    """
    __tablename__ = "users"
    
    # Claves primarias e índices
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Información personal
    full_name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    user_type = Column(String(20), default="student")  # "student", "tutor", "admin"
    carrera = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones a otras tablas
    interest_subjects = relationship("InterestSubject", back_populates="user", cascade="all, delete-orphan", foreign_keys="InterestSubject.university_id")
    tutoring_preferences = relationship("TutoringPreference", back_populates="user", cascade="all, delete-orphan", foreign_keys="TutoringPreference.university_id")
    disability = relationship("UserDisability", back_populates="user", cascade="all, delete-orphan", uselist=False, foreign_keys="UserDisability.university_id")
    sessions = relationship("TutoringSession", back_populates="tutor", cascade="all, delete-orphan")


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: InterestSubject (Materias de Interés)
# ════════════════════════════════════════════════════════════════════════════════

class InterestSubject(Base):
    """
    PROPÓSITO: Almacena las materias que un estudiante estudia o un tutor enseña
    
    CAMPOS:
      - id: Identificador único
      - university_id: FK a User (referencia al usuario)
      - subject_name: Nombre de la materia (ej: "Cálculo", "Programación I")
      - created_at: Fecha de adición
      
    RESTRICCIONES:
      - unique_student_subject: Un usuario no puede tener duplicadas materias
    """
    __tablename__ = "interest_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relación bidireccional con User
    user = relationship("User", back_populates="interest_subjects", foreign_keys=[university_id])
    
    # Constraint: Cada usuario solo puede tener cada materia una vez
    __table_args__ = (
        UniqueConstraint('university_id', 'subject_name', name='unique_student_subject'),
    )


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: TutoringPreference (Preferencias de Horario)
# ════════════════════════════════════════════════════════════════════════════════

class TutoringPreference(Base):
    """
    PROPÓSITO: Almacena preferencias de horario de los usuarios
    
    CAMPOS:
      - id: Identificador único
      - university_id: FK a User
      - preference_type: Tipo de preferencia ("morning", "afternoon", "evening")
      - enabled: Si la preferencia está activa
      - created_at: Fecha de creación
    """
    __tablename__ = "tutoring_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False)
    preference_type = Column(String(50), nullable=False)  # "morning", "afternoon", "evening"
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="tutoring_preferences", foreign_keys=[university_id])
    
    # Constraint: Un usuario solo puede tener una preferencia de cada tipo
    __table_args__ = (
        UniqueConstraint('university_id', 'preference_type', name='unique_student_preference'),
    )


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: UserDisability (Necesidades de Accesibilidad)
# ════════════════════════════════════════════════════════════════════════════════

class UserDisability(Base):
    """
    PROPÓSITO: Registra discapacidades o necesidades de accesibilidad del usuario
    
    CAMPOS:
      - id: Identificador único
      - university_id: FK a User (único: un usuario, una discapacidad)
      - disability_type: Tipo de discapacidad ("visual", "auditiva", "motriz", etc.)
      - disability_description: Descripción detallada de necesidades
      - created_at: Fecha de creación
      - updated_at: Última fecha de actualización
      
    NOTA: Para tutores, se registra en la tabla separada de qué discapacidades PUEDEN ATENDER
    """
    __tablename__ = "user_disabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False, unique=True)
    disability_type = Column(String(50), nullable=True)
    disability_description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="disability", foreign_keys=[university_id])


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: TutoringSession (Sesiones de Tutoría)
# ════════════════════════════════════════════════════════════════════════════════

class TutoringSession(Base):
    """
    PROPÓSITO: Almacena sesiones de tutoría ofrecidas por tutores
    
    CAMPOS:
      - id: Identificador único
      - tutor_id: FK a User (quién ofrece la sesión)
      - subject: Materia de la sesión (ej: "Cálculo I")
      - date_time: Fecha y hora de inicio de la sesión
      - duration: Duración en minutos (ej: 60)
      - spots: Cantidad total de espacios disponibles
      - spots_available: Espacios disponibles actualmente
      - room: Sala/aula donde se realiza (ej: "Aula 101")
      - accessibility_type: Tipos de accesibilidad disponibles ("wheelchair,visual")
      - created_at: Fecha de creación
      
    RELACIONES:
      - tutor: Referencia al User (tutor)
      - enrollments: Lista de TutoringEnrollments (estudiantes inscritos)
    """
    __tablename__ = "tutoring_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(150), nullable=False)
    date_time = Column(DateTime, nullable=False)
    duration = Column(Integer, default=60)  # Duración en minutos
    spots = Column(Integer, default=5)  # Total de espacios
    spots_available = Column(Integer, default=5)  # Espacios libres
    room = Column(String(100), nullable=True)  # Aula donde se dicta
    accessibility_type = Column(String(100), nullable=True)  # "wheelchair", "visual", "hearing" (separadas por coma)
    created_at = Column(DateTime, server_default=func.now())
    
    tutor = relationship("User", back_populates="sessions")
    enrollments = relationship("TutoringEnrollment", back_populates="session", cascade="all, delete-orphan")


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: TutoringEnrollment (Inscripciones en Sesiones)
# ════════════════════════════════════════════════════════════════════════════════

class TutoringEnrollment(Base):
    """
    PROPÓSITO: Almacena la relación entre estudiantes e sesiones (quién está inscrito)
    
    CAMPOS:
      - id: Identificador único
      - student_id: FK a User (estudiante inscrito)
      - session_id: FK a TutoringSession (sesión en la que se inscribió)
      - created_at: Fecha de inscripción
      
    RESTRICCIONES:
      - unique_student_session_enrollment: Un estudiante no puede inscribirse 2 veces en la misma sesión
    """
    __tablename__ = "tutoring_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("tutoring_sessions.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User")
    session = relationship("TutoringSession", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint('student_id', 'session_id', name='unique_student_session_enrollment'),
    )


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: TutorRating (Calificaciones de Tutores)
# ════════════════════════════════════════════════════════════════════════════════

class TutorRating(Base):
    """
    PROPÓSITO: Almacena calificaciones/valoraciones que estudiantes dan a tutores
    
    CAMPOS:
      - id: Identificador único
      - student_id: FK a User (estudiante que califica)
      - tutor_id: FK a User (tutor calificado)
      - session_id: FK a TutoringSession (sesión en la que ocurrió)
      - stars: Calificación (1-5 estrellas)
      - comment: Comentario opcional del estudiante
      - created_at: Fecha de calificación
      
    RESTRICCIONES:
      - unique_student_session_rating: Un estudiante solo puede calificar una vez por sesión
    """
    __tablename__ = "tutor_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tutor_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("tutoring_sessions.id"), nullable=False)
    stars      = Column(Integer, nullable=False)  # 1 a 5
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", foreign_keys=[student_id])
    tutor   = relationship("User", foreign_keys=[tutor_id])
    session = relationship("TutoringSession")

    __table_args__ = (
        UniqueConstraint('student_id', 'session_id', name='unique_student_session_rating'),
    )


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: WaitlistEntry (Lista de Espera)
# ════════════════════════════════════════════════════════════════════════════════

class WaitlistEntry(Base):
    """
    PROPÓSITO: Cuando una sesión está llena, estudiantes pueden esperar en lista
    
    CAMPOS:
      - id: Identificador único
      - student_id: FK a User (estudiante en espera)
      - session_id: FK a TutoringSession (sesión llena)
      - position: Posición en la lista de espera (1, 2, 3, etc.)
      - notified: Si el estudiante fue notificado de un espacio disponible
      - created_at: Fecha de ingreso a lista de espera
    """
    __tablename__ = "waitlist_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("tutoring_sessions.id"), nullable=False)
    position = Column(Integer, nullable=False)
    notified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User")
    session = relationship("TutoringSession")

    __table_args__ = (
        UniqueConstraint('student_id', 'session_id', name='unique_student_session_waitlist'),
    )


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: Room (Aulas/Salas)
# ════════════════════════════════════════════════════════════════════════════════

class Room(Base):
    """
    PROPÓSITO: Almacena información de las aulas disponibles en la universidad
    
    CAMPOS:
      - id: Identificador único
      - name: Nombre/código de la aula (ej: "A101")
      - building: Edificio donde está (ej: "Edificio A")
      - capacity: Capacidad máxima de personas
      - available: Si el aula está disponible para uso
      - accessibility_wheelchair: Si tiene acceso para sillas de ruedas
      - accessibility_visual: Si tiene equipos de soporte visual
      - accessibility_hearing: Si tiene sistemas de amplificación auditiva
      - created_at: Fecha de registro
    """
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    building = Column(String(100), nullable=False)
    capacity = Column(Integer, default=30)
    available = Column(Boolean, default=True)
    accessibility_wheelchair = Column(Boolean, default=False)
    accessibility_visual = Column(Boolean, default=False)
    accessibility_hearing = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    availabilities = relationship("RoomAvailability", back_populates="room", cascade="all, delete-orphan")


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: PasswordResetToken (Tokens de Recuperación de Contraseña)
# ════════════════════════════════════════════════════════════════════════════════

class PasswordResetToken(Base):
    """
    PROPÓSITO: Almacena tokens temporales para recuperación de contraseña olvidada
    
    CAMPOS:
      - id: Identificador único
      - user_id: FK a User (usuario que solicita reseteo)
      - token: Token único generado (64 caracteres hexadecimales)
      - expires_at: Fecha/hora en que el token expira (ej: 24 horas después)
      - used: Si el token ya fue utilizado
      
    FLUJO:
      1. Usuario olvida contraseña → solicita recuperación
      2. Sistema genera token aleatorio y guarda en BD
      3. Se envía enlace con token al correo
      4. Usuario hace click → valida token y permite resetear
      5. Token se marca como "used" para evitar reutilización
    """
    __tablename__ = "password_reset_tokens"
    
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)


# ════════════════════════════════════════════════════════════════════════════════
# MODELO: RoomAvailability (Disponibilidad de Aulas)
# ════════════════════════════════════════════════════════════════════════════════

class RoomAvailability(Base):
    """
    PROPÓSITO: Define cuándo cada aula está disponible (horarios por día)
    
    CAMPOS:
      - id: Identificador único
      - room_id: FK a Room (aula)
      - day: Día de la semana (ej: "Lunes", "Martes") - NULL si es fecha específica
      - specific_date: Fecha específica (YYYY-MM-DD) - para fechas no regulares
      - start_time: Hora de inicio en formato HH:MM
      - end_time: Hora de fin en formato HH:MM
      
    NOTA: O se usa 'day' (para disponibilidad semanal) o 'specific_date' (para fechas especiales)
    """
    __tablename__ = "room_availabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    day = Column(String(20), nullable=True)  # "Lunes", "Martes", etc. NULL si es specific_date
    specific_date = Column(Date, nullable=True)  # YYYY-MM-DD para disponibilidad especial
    start_time = Column(String(5), nullable=False)  # "08:00"
    end_time = Column(String(5), nullable=False)  # "18:00"

    room = relationship("Room", back_populates="availabilities")
