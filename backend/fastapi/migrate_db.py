from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:2222@127.0.0.1:3306/tutor_db")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Running migrations...")
        
        # 1. Update users table
        try:
            conn.execute(text("ALTER TABLE users CHANGE student_id university_id VARCHAR(50)"))
            print("Updated users.student_id -> university_id")
        except Exception as e:
            print(f"Skipped users update: {e}")

        # 2. Update interest_subjects table
        try:
            conn.execute(text("ALTER TABLE interest_subjects CHANGE student_id university_id VARCHAR(50)"))
            print("Updated interest_subjects.student_id -> university_id")
        except Exception as e:
            print(f"Skipped interest_subjects update: {e}")

        # 3. Update tutoring_preferences table
        try:
            conn.execute(text("ALTER TABLE tutoring_preferences CHANGE student_id university_id VARCHAR(50)"))
            print("Updated tutoring_preferences.student_id -> university_id")
        except Exception as e:
            print(f"Skipped tutoring_preferences update: {e}")

        # 4. Update user_disabilities table
        try:
            conn.execute(text("ALTER TABLE user_disabilities CHANGE student_id university_id VARCHAR(50)"))
            print("Updated user_disabilities.student_id -> university_id")
        except Exception as e:
            print(f"Skipped user_disabilities update: {e}")

        # 5. Add accessibility_type to tutoring_sessions
        try:
            conn.execute(text("ALTER TABLE tutoring_sessions ADD COLUMN accessibility_type VARCHAR(100) AFTER room"))
            print("Added accessibility_type to tutoring_sessions")
        except Exception as e:
            print(f"Skipped adding accessibility_type: {e}")
            
        conn.commit()
        print("Migration finished!")

if __name__ == "__main__":
    run_migration()
