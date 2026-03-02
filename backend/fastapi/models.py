from sqlalchemy import Column, Integer, String, DateTime, func, Text, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    user_type = Column(String(20), default="student")
    carrera = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones por student_id
    interest_subjects = relationship("InterestSubject", back_populates="user", cascade="all, delete-orphan", foreign_keys="InterestSubject.university_id")
    tutoring_preferences = relationship("TutoringPreference", back_populates="user", cascade="all, delete-orphan", foreign_keys="TutoringPreference.university_id")
    disability = relationship("UserDisability", back_populates="user", cascade="all, delete-orphan", uselist=False, foreign_keys="UserDisability.university_id")
    sessions = relationship("TutoringSession", back_populates="tutor", cascade="all, delete-orphan")


class InterestSubject(Base):
    __tablename__ = "interest_subjects"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False)

    subject_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="interest_subjects", foreign_keys=[university_id])
    
    __table_args__ = (
        UniqueConstraint('university_id', 'subject_name', name='unique_student_subject'),
    )


class TutoringPreference(Base):
    __tablename__ = "tutoring_preferences"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False)
    preference_type = Column(String(50), nullable=False)  # morning, afternoon, evening
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="tutoring_preferences", foreign_keys=[university_id])
    
    __table_args__ = (
        UniqueConstraint('university_id', 'preference_type', name='unique_student_preference'),
    )


class UserDisability(Base):
    __tablename__ = "user_disabilities"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(50), ForeignKey("users.university_id"), nullable=False, unique=True)
    disability_type = Column(String(50), nullable=True)
    disability_description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="disability", foreign_keys=[university_id])


class TutoringSession(Base):
    __tablename__ = "tutoring_sessions"
    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(150), nullable=False)
    date_time = Column(DateTime, nullable=False)
    duration = Column(Integer, default=60)  # minutes
    spots = Column(Integer, default=5)
    spots_available = Column(Integer, default=5)
    room = Column(String(100), nullable=True)
    accessibility_type = Column(String(100), nullable=True)  # comma separated: wheelchair, visual, hearing, etc
    created_at = Column(DateTime, server_default=func.now())
    
    tutor = relationship("User", back_populates="sessions")
    enrollments = relationship("TutoringEnrollment", back_populates="session", cascade="all, delete-orphan")


class TutoringEnrollment(Base):
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


class Room(Base):
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
