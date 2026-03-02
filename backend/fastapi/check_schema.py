from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:2222@127.0.0.1:3306/tutor_db")

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

with open("schema_output.txt", "w") as f:
    for table_name in inspector.get_table_names():
        f.write(f"\nTable: {table_name}\n")
        for column in inspector.get_columns(table_name):
            f.write(f"  Column: {column['name']} ({column['type']})\n")
