from sqlalchemy import Column, Integer, String, DateTime, func, Text, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    user_type = Column(String(20), default="student")
    carrera = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones por student_id
    interest_subjects = relationship("InterestSubject", back_populates="user", cascade="all, delete-orphan", foreign_keys="InterestSubject.student_id")
    tutoring_preferences = relationship("TutoringPreference", back_populates="user", cascade="all, delete-orphan", foreign_keys="TutoringPreference.student_id")
    disability = relationship("UserDisability", back_populates="user", cascade="all, delete-orphan", uselist=False, foreign_keys="UserDisability.student_id")


class InterestSubject(Base):
    __tablename__ = "interest_subjects"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("users.student_id"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="interest_subjects", foreign_keys=[student_id])
    
    __table_args__ = (
        UniqueConstraint('student_id', 'subject_name', name='unique_student_subject'),
    )


class TutoringPreference(Base):
    __tablename__ = "tutoring_preferences"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("users.student_id"), nullable=False)
    preference_type = Column(String(50), nullable=False)  # morning, afternoon, evening
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="tutoring_preferences", foreign_keys=[student_id])
    
    __table_args__ = (
        UniqueConstraint('student_id', 'preference_type', name='unique_student_preference'),
    )


class UserDisability(Base):
    __tablename__ = "user_disabilities"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("users.student_id"), nullable=False, unique=True)
    disability_type = Column(String(50), nullable=True)
    disability_description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="disability", foreign_keys=[student_id])
