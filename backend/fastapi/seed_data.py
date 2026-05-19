"""
Datos sintéticos para desarrollo.
Ejecución: python seed_data.py
Idempotente: omite registros que ya existan (por university_id / email).
Contraseña de todos los usuarios semilla: Seed1234
"""
import bcrypt
from datetime import datetime, timedelta
from db import SessionLocal, init_db
from models import User, UserDisability, TutoringSession, TutoringEnrollment, Room

PASSWORD_HASH = bcrypt.hashpw(b"Seed1234", bcrypt.gensalt()).decode()

# ── Tutores ───────────────────────────────────────────────────────────────────

TUTORS = [
    dict(university_id="20180001", full_name="Carlos Mendoza Ruiz",
         email="carlos.mendoza@unab.edu.co", carrera="Ingeniería de Sistemas"),
    dict(university_id="20170045", full_name="Ana García Peña",
         email="ana.garcia@unab.edu.co",     carrera="Ingeniería Industrial"),
    dict(university_id="20160089", full_name="Roberto Silva Mora",
         email="roberto.silva@unab.edu.co",  carrera="Ingeniería Civil"),
]

TUTOR_DISABILITIES = {
    "20180001": ("visual",   "Experiencia con estudiantes con discapacidad visual"),
    "20170045": ("auditiva", "Maneja lenguaje de señas colombiano"),
    "20160089": ("ninguna",  None),
}

# ── Estudiantes ───────────────────────────────────────────────────────────────

STUDENTS = [
    dict(university_id="20230001", full_name="Juan Pérez González",
         email="juan.perez@unab.edu.co",         carrera="Ingeniería de Sistemas"),
    dict(university_id="20230002", full_name="María López Castro",
         email="maria.lopez@unab.edu.co",         carrera="Ingeniería Industrial"),
    dict(university_id="20230003", full_name="Diego Rodríguez Vargas",
         email="diego.rodriguez@unab.edu.co",     carrera="Derecho"),
    dict(university_id="20230004", full_name="Valentina Torres Ríos",
         email="valentina.torres@unab.edu.co",    carrera="Medicina"),
    dict(university_id="20230005", full_name="Andrés Gómez Prada",
         email="andres.gomez@unab.edu.co",        carrera="Ingeniería de Sistemas"),
    dict(university_id="20230006", full_name="Sofía Martínez Luna",
         email="sofia.martinez@unab.edu.co",      carrera="Administración"),
    dict(university_id="20230007", full_name="Camilo Herrera Díaz",
         email="camilo.herrera@unab.edu.co",      carrera="Ingeniería Civil"),
    dict(university_id="20230008", full_name="Laura Castillo Ávila",
         email="laura.castillo@unab.edu.co",      carrera="Contabilidad"),
]

STUDENT_DISABILITIES = {
    "20230001": ("visual",    "Baja visión, necesita presentaciones con fuente grande"),
    "20230004": ("auditiva",  "Hipoacusia bilateral moderada"),
    "20230007": ("motriz",    "Movilidad reducida en miembros superiores"),
}

# ── Sesiones de tutoría ───────────────────────────────────────────────────────
# Formato: (tutor_idx, subject, days_ahead, hour, minute, duration_min, spots, room, accessibility)

_BASE = datetime.now().replace(second=0, microsecond=0)

def _dt(days: int, hour: int, minute: int = 0) -> datetime:
    return (_BASE + timedelta(days=days)).replace(hour=hour, minute=minute)

SESSIONS = [
    # Carlos — Cálculo / Álgebra
    ("20180001", "Cálculo I",            _dt(1, 10),  90, 8,  "L-201", None),
    ("20180001", "Cálculo I",            _dt(4, 14),  90, 8,  "L-201", None),
    ("20180001", "Álgebra Lineal",       _dt(6,  9),  60, 6,  "L-205", "visual"),
    ("20180001", "Cálculo II",           _dt(9, 13),  90, 6,  "L-201", None),
    # Ana — Física / Programación
    ("20170045", "Física II",            _dt(2,  8), 120, 10, "B-101", "auditiva"),
    ("20170045", "Física II",            _dt(8, 15), 120, 10, "B-101", "auditiva"),
    ("20170045", "Programación en Python",_dt(3, 11), 90, 8,  "L-301", None),
    ("20170045", "Termodinámica",        _dt(11,16),  60, 5,  "B-203", None),
    # Roberto — Estructuras / BD / Software
    ("20160089", "Estructuras de Datos", _dt(1, 15),  60, 6,  "L-401", None),
    ("20160089", "Estructuras de Datos", _dt(7, 10),  60, 6,  "L-401", None),
    ("20160089", "Bases de Datos",       _dt(4,  9),  90, 8,  "L-305", "motriz"),
    ("20160089", "Diseño de Software",   _dt(13,11),  90, 8,  "L-402", None),
]

# ── Salones ───────────────────────────────────────────────────────────────────
# (name, building, capacity, wheelchair, visual, hearing)

ROOMS = [
    ("L-201", "Bloque L", 30, True,  True,  False),   # Silla de ruedas + visual
    ("L-205", "Bloque L", 25, False, True,  False),   # Solo visual
    ("L-301", "Bloque L", 40, False, False, False),   # Sin accesibilidad especial
    ("L-305", "Bloque L", 35, True,  False, True),    # Silla de ruedas + auditivo
    ("L-401", "Bloque L", 30, True,  True,  True),    # Accesibilidad completa
    ("L-402", "Bloque L", 30, True,  False, False),   # Solo silla de ruedas
    ("B-101", "Bloque B", 50, True,  True,  True),    # Accesibilidad completa
    ("B-203", "Bloque B", 25, False, False, True),    # Solo auditivo
    ("C-101", "Bloque C", 45, True,  True,  True),    # Accesibilidad completa
    ("A-201", "Bloque A", 20, False, False, False),   # Sin accesibilidad especial
    ("A-105", "Bloque A", 35, True,  False, True),    # Silla de ruedas + auditivo
    ("D-301", "Bloque D", 60, True,  True,  False),   # Silla de ruedas + visual
]

# ── Inscripciones ─────────────────────────────────────────────────────────────
# (session_index, [student_university_ids])
# Diseñadas para mostrar estados variados: casi llena, a la mitad, pocas inscritas

ENROLLMENTS = [
    (0,  ["20230001","20230002","20230003","20230004","20230005","20230006"]),  # 6/8
    (1,  ["20230007","20230008"]),                                             # 2/8
    (2,  ["20230001","20230003","20230005","20230008"]),                        # 4/6
    (3,  ["20230002","20230006"]),                                             # 2/6
    (4,  ["20230001","20230002","20230003","20230004","20230005",
          "20230006","20230007"]),                                             # 7/10
    (5,  ["20230008"]),                                                        # 1/10
    (6,  ["20230001","20230004","20230006"]),                                  # 3/8
    (7,  ["20230002","20230003","20230005","20230007"]),                        # 4/8
    (8,  ["20230001","20230002","20230004"]),                                  # 3/6
    (9,  ["20230003","20230005","20230006","20230008"]),                        # 4/6
    (10, ["20230001","20230007","20230003","20230004","20230006"]),             # 5/8
    (11, ["20230002"]),                                                        # 1/8
]

# ── Runner ────────────────────────────────────────────────────────────────────

def _get_or_create_user(db, data: dict, user_type: str) -> User:
    user = db.query(User).filter(User.university_id == data["university_id"]).first()
    if user:
        return user
    user = User(
        university_id=data["university_id"],
        full_name=data["full_name"],
        email=data["email"],
        hashed_password=PASSWORD_HASH,
        user_type=user_type,
        carrera=data["carrera"],
    )
    db.add(user)
    db.flush()
    return user


def seed():
    init_db()
    db = SessionLocal()
    try:
        print("[seed] Creating rooms…")
        for name, building, capacity, wheelchair, visual, hearing in ROOMS:
            exists = db.query(Room).filter(Room.name == name).first()
            if not exists:
                db.add(Room(
                    name=name,
                    building=building,
                    capacity=capacity,
                    available=True,
                    accessibility_wheelchair=wheelchair,
                    accessibility_visual=visual,
                    accessibility_hearing=hearing,
                ))
        db.commit()

        print("[seed] Creating tutors…")
        tutor_map: dict[str, User] = {}
        for t in TUTORS:
            u = _get_or_create_user(db, t, "tutor")
            tutor_map[t["university_id"]] = u
            dtype, ddesc = TUTOR_DISABILITIES.get(t["university_id"], (None, None))
            if dtype and dtype != "ninguna":
                exists = db.query(UserDisability).filter(
                    UserDisability.university_id == t["university_id"]
                ).first()
                if not exists:
                    db.add(UserDisability(
                        university_id=t["university_id"],
                        disability_type=dtype,
                        disability_description=ddesc,
                    ))

        print("[seed] Creating students…")
        student_map: dict[str, User] = {}
        for s in STUDENTS:
            u = _get_or_create_user(db, s, "student")
            student_map[s["university_id"]] = u
            dtype, ddesc = STUDENT_DISABILITIES.get(s["university_id"], (None, None))
            if dtype:
                exists = db.query(UserDisability).filter(
                    UserDisability.university_id == s["university_id"]
                ).first()
                if not exists:
                    db.add(UserDisability(
                        university_id=s["university_id"],
                        disability_type=dtype,
                        disability_description=ddesc,
                    ))

        db.commit()

        print("[seed] Creating tutoring sessions…")
        session_objs: list[TutoringSession] = []
        for tutor_uid, subject, dt, duration, spots, room, accessibility in SESSIONS:
            tutor = tutor_map[tutor_uid]
            existing = db.query(TutoringSession).filter(
                TutoringSession.tutor_id == tutor.id,
                TutoringSession.subject  == subject,
                TutoringSession.date_time == dt,
            ).first()
            if existing:
                session_objs.append(existing)
                continue
            sess = TutoringSession(
                tutor_id=tutor.id,
                subject=subject,
                date_time=dt,
                duration=duration,
                spots=spots,
                spots_available=spots,
                room=room,
                accessibility_type=accessibility,
            )
            db.add(sess)
            db.flush()
            session_objs.append(sess)

        db.commit()

        print("[seed] Enrolling students…")
        for sess_idx, student_uids in ENROLLMENTS:
            sess = session_objs[sess_idx]
            enrolled = 0
            for uid in student_uids:
                student = student_map[uid]
                already = db.query(TutoringEnrollment).filter(
                    TutoringEnrollment.student_id == student.id,
                    TutoringEnrollment.session_id == sess.id,
                ).first()
                if already:
                    continue
                if sess.spots_available <= 0:
                    print(f"  [skip] Session {sess.id} ({sess.subject}) is full")
                    break
                db.add(TutoringEnrollment(student_id=student.id, session_id=sess.id))
                sess.spots_available -= 1
                enrolled += 1
            if enrolled:
                print(f"  Session {sess.id} ({sess.subject}): +{enrolled} enrollments "
                      f"({sess.spots - sess.spots_available}/{sess.spots} spots taken)")

        db.commit()
        print("[seed] ✓ Done. All synthetic data inserted.")
        print("\nCredenciales de prueba (contraseña: Seed1234)")
        print("  Tutores:    carlos.mendoza | ana.garcia | roberto.silva  @unab.edu.co")
        print("  Estudiantes: juan.perez | maria.lopez | diego.rodriguez  … (20230001–20230008)")

    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        print(f"[seed] ERROR: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
