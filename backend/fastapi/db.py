"""
╔════════════════════════════════════════════════════════════════════════════════╗
║                  CONFIGURACIÓN DE BASE DE DATOS - FastAPI                      ║
║                         MySQL Connection & Setup                               ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Este módulo configura la conexión a la base de datos MySQL y proporciona
  las herramientas para gestionar sesiones de BD y crear tablas.

FUNCIONALIDADES CLAVE:
  1. Carga variables de entorno para conexión a BD
  2. Crea la BD automáticamente si no existe
  3. Configura engine SQLAlchemy para transacciones
  4. Proporciona SessionLocal para acceso a BD en rutas
  5. Define Base para modelos SQLAlchemy

FLUJO GENERAL:
  Carga config → Conecta sin BD → Crea BD si no existe → Conecta a BD → Crea tablas
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# ════════════════════════════════════════════════════════════════════════════════
# CARGA DE VARIABLES DE ENTORNO
# ════════════════════════════════════════════════════════════════════════════════

load_dotenv()  # Carga variables del archivo .env

# Credenciales y configuración de conexión a MySQL
# Valores por defecto para desarrollo local
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "2222")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tutor_db")

# ════════════════════════════════════════════════════════════════════════════════
# CREACIÓN AUTOMÁTICA DE BASE DE DATOS
# ════════════════════════════════════════════════════════════════════════════════

# Primero conectar SIN especificar BD para crear la BD si no existe
BASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}"
temp_engine = create_engine(BASE_URL, pool_pre_ping=True)

# Ejecuta comando SQL para crear BD si no existe
with temp_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    conn.commit()

temp_engine.dispose()  # Cierra conexión temporal

# ════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE ENGINE SQLALCHEMY (con BD específica)
# ════════════════════════════════════════════════════════════════════════════════

# Configuración SSL (requerida para bases de datos en la nube como PlanetScale)
DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"
connect_args = {}
if DB_SSL:
    connect_args = {
        "ssl": {
            "ssl_mode": "verify_identity"
            # Si tienes certificado CA específico, añadirlo aquí:
            # "ca": "/etc/ssl/certs/ca-certificates.crt" 
        }
    }

# Ahora conectar a la base de datos específica
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Engine: Centro de conexión a BD
# - pool_pre_ping=True: Verifica conexiones antes de usar (evita errores de timeout)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)

# SessionLocal: Factory para crear sesiones de BD en rutas
# - autocommit=False: Requiere commit() explícito
# - autoflush=False: Control manual de flush de cambios
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: Clase base para todos los modelos SQLAlchemy
Base = declarative_base()

print(f"[db] Using DATABASE_URL={DATABASE_URL}")

# ════════════════════════════════════════════════════════════════════════════════
# INICIALIZACIÓN DE TABLAS
# ════════════════════════════════════════════════════════════════════════════════

def init_db():
    """
    PROPÓSITO: Crea todas las tablas en la BD basadas en modelos SQLAlchemy
    
    FLUJO:
      1. Importa modelos (evita referencias circulares al importar aquí)
      2. Usa metadata de Base para crear tablas
      3. Solo crea tablas que no existan
      4. Registra en consola si tuvo éxito
    """
    # Import aquí para evitar referencias circulares con models.py
    import models
    
    # Crea todas las tablas del metadata en la BD
    Base.metadata.create_all(bind=engine)
    print("[db] Tables created successfully")
