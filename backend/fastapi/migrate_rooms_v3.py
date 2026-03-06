from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "2222")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tutor_db")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding specific_date column to room_availabilities...")
    try:
        conn.execute(text("ALTER TABLE room_availabilities ADD COLUMN specific_date DATE NULL"))
        conn.execute(text("ALTER TABLE room_availabilities MODIFY COLUMN day VARCHAR(20) NULL"))
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error: {e}")
