from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:2222@127.0.0.1:3306/tutor_db")

engine = create_engine(DATABASE_URL)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def run_migration():
    with engine.connect() as conn:
        print("Running migrations v2...")
        
        # 1. Create rooms table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    building VARCHAR(100) NOT NULL,
                    capacity INTEGER DEFAULT 30,
                    available TINYINT DEFAULT 1,
                    accessibility_wheelchair TINYINT DEFAULT 0,
                    accessibility_visual TINYINT DEFAULT 0,
                    accessibility_hearing TINYINT DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Created rooms table")
        except Exception as e:
            print(f"Skipped rooms creation: {e}")

        # 2. Add admin user if not exists
        try:
            admin_id = "admin"
            existing = conn.execute(text("SELECT id FROM users WHERE university_id = :uid"), {"uid": admin_id}).fetchone()
            if not existing:
                hp = hash_password("1234")
                conn.execute(text("""
                    INSERT INTO users (university_id, full_name, email, hashed_password, user_type, created_at)
                    VALUES (:uid, 'Administrador PITA', 'admin@pita.edu.co', :hp, 'admin', NOW())
                """), {"uid": admin_id, "hp": hp})
                print("Created admin user (admin / 1234)")
            else:
                print("Admin user already exists")
        except Exception as e:
            print(f"Error checking/creating admin: {e}")

        conn.commit()
        print("Migration v2 finished!")

if __name__ == "__main__":
    run_migration()
