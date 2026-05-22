"""
╔════════════════════════════════════════════════════════════════════════════════╗
║              CONTROLADOR DE HORARIOS - FastAPI                                ║
║              Gestión de horarios académicos de tutores y estudiantes           ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Maneja los horarios académicos de tutores y estudiantes.
  Permite guardar, obtener y verificar conflictos de horarios.

ENDPOINTS:
  1. POST   /api/horario/{user_id} - Guarda horario del usuario
  2. GET    /api/horario/{user_id} - Obtiene horario guardado
  3. POST   /api/horario/{user_id}/verificar - Verifica conflictos de horarios

FLUJO:
  Tutor/estudiante carga horario → Se guarda en JSON → Al crear sesión, se verifica conflicto
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from pathlib import Path
import json
import datetime

# Directorio donde se almacenan archivos JSON de horarios
HORARIOS_DIR = Path(__file__).parent / "horarios"
HORARIOS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(tags=["Manejo de Horario"])

# ════════════════════════════════════════════════════════════════════════════════
# MODELOS PYDANTIC (Esquemas de validación)
# ════════════════════════════════════════════════════════════════════════════════

class Bloque(BaseModel):
    """
    PROPÓSITO: Representa un bloque de tiempo en el horario
    
    CAMPOS:
      - day: Día de la semana (ej: "Lunes")
      - startTime: Hora de inicio (ej: "08:00")
      - endTime: Hora de fin (ej: "10:00")
      - subject: Materia o actividad (ej: "Cálculo I", "Trabajo")
    """
    day: str
    startTime: str
    endTime: str
    subject: str

# ════════════════════════════════════════════════════════════════════════════════
# ENDPOINT: Guardar Horario del Usuario
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/{user_id}")
async def guardar_horario(user_id: str, bloques: list[Bloque] = Body(...)):
    """
    PROPÓSITO: Guarda el horario de un usuario (tutor/estudiante) en archivo JSON
    
    PARÁMETROS:
      - user_id: ID del usuario
      - bloques: Lista de bloques de tiempo con materias
      
    FLUJO:
      1. Recibe lista de bloques con horarios
      2. Crea estructura JSON con metadata
      3. Guarda en archivo horario_{user_id}.json
      4. Retorna confirmación y datos guardados
      
    FORMATO DE RESPUESTA:
    {
      "message": "Horario guardado",
      "data": {
        "userId": "12345",
        "fechaGuardado": "2024-05-22T10:30:00",
        "horario": [
          {"day": "Lunes", "startTime": "08:00", "endTime": "10:00", "subject": "Cálculo I"}
        ]
      }
    }
    """
    data = {
        "userId": user_id,
        "fechaGuardado": datetime.datetime.utcnow().isoformat(),  # Timestamp UTC
        "horario": [b.dict() for b in bloques]  # Convierte modelos a diccionarios
    }
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")  # Escribe JSON formateado
    return {"message": "Horario guardado", "data": data}

# ════════════════════════════════════════════════════════════════════════════════
# ENDPOINT: Obtener Horario del Usuario
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/{user_id}")
async def obtener_horario(user_id: str):
    """
    PROPÓSITO: Obtiene el horario guardado de un usuario
    
    PARÁMETROS:
      - user_id: ID del usuario
      
    FLUJO:
      1. Busca archivo horario_{user_id}.json
      2. Si existe, lo lee y parsea como JSON
      3. Si no existe, retorna estructura vacía
      4. Retorna los datos al cliente
      
    RESPUESTA SI EXISTE:
    {
      "userId": "12345",
      "fechaGuardado": "2024-05-22T10:30:00",
      "horario": [...]
    }
    
    RESPUESTA SI NO EXISTE:
    {
      "userId": "12345",
      "fechaGuardado": null,
      "horario": []
    }
    """
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    if not path.exists():
        # Retorna estructura vacía si no hay horario guardado
        return {"userId": user_id, "fechaGuardado": None, "horario": []}
    return json.loads(path.read_text(encoding="utf-8"))

# ════════════════════════════════════════════════════════════════════════════════
# ENDPOINT: Verificar Conflictos de Horarios
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/{user_id}/verificar")
async def verificar(user_id: str, fecha_sesion: str = Body(...), duracion_minutos: int = Body(...)):
    """
    PROPÓSITO: Verifica si una sesión propuesta conflictúa con el horario del usuario
    
    PARÁMETROS:
      - user_id: ID del usuario
      - fecha_sesion: Fecha/hora ISO (ej: "2024-05-22T14:00")
      - duracion_minutos: Duración de la sesión en minutos
      
    FLUJO:
      1. Valida que la fecha sea ISO format
      2. Obtiene el horario guardado del usuario
      3. Extrae día de la semana de la fecha
      4. Convierte hora de sesión a minutos para comparar
      5. Recorre bloques del horario
      6. Detecta solapamientos entre rangos de tiempo
      7. Retorna información de conflictos encontrados
      
    LÓGICA DE DETECCIÓN DE CONFLICTO:
      Hay conflicto si: NOT (fin_sesión <= inicio_bloque OR inicio_sesión >= fin_bloque)
      
    EJEMPLO DE RESPUESTA:
    {
      "hayConflicto": true,
      "conflictosEncontrados": [
        {
          "dia": "Martes",
          "materia": "Cálculo I",
          "horaInicio": "14:00",
          "horaFin": "16:00"
        }
      ],
      "mensaje": "OK"
    }
    """
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    
    # Si no hay horario registrado, no hay conflictos
    if not path.exists():
        return {"hayConflicto": False, "conflictosEncontrados": [], "mensaje": "No hay horario registrado aún"}

    horarioData = json.loads(path.read_text(encoding="utf-8"))
    
    # Valida formato ISO de fecha
    try:
        sessionDate = datetime.datetime.fromisoformat(fecha_sesion)
    except Exception:
        raise HTTPException(status_code=400, detail="fecha_sesion debe ser ISO format: YYYY-MM-DDTHH:MM")

    # Obtiene nombre del día en español (lunes, martes, miércoles, etc.)
    dayName = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"][sessionDate.weekday()]
    
    # Convierte hora de sesión a minutos desde medianoche
    sessionStartInMinutes = sessionDate.hour * 60 + sessionDate.minute
    sessionEndInMinutes = sessionStartInMinutes + duracion_minutos

    hayConflicto = False
    conflictosEncontrados = []

    # Recorre cada bloque en el horario guardado
    for bloque in horarioData.get("horario", []):
        # Compara solo si es el mismo día
        if bloque.get("day", "").lower() == dayName:
            # Convierte horas de inicio/fin del bloque a minutos
            sh, sm = map(int, bloque.get("startTime").split(":"))
            eh, em = map(int, bloque.get("endTime").split(":"))
            startTimeInMinutes = sh * 60 + sm
            endTimeInMinutes = eh * 60 + em
            
            # Detecta si hay solapamiento de horarios
            # No hay conflicto solo si: sesión termina antes de bloque O sesión inicia después de bloque
            if not (sessionEndInMinutes <= startTimeInMinutes or sessionStartInMinutes >= endTimeInMinutes):
                hayConflicto = True
                conflictosEncontrados.append({
                    "dia": bloque.get("day"),
                    "materia": bloque.get("subject"),
                    "horaInicio": bloque.get("startTime"),
                    "horaFin": bloque.get("endTime")
                })

    return {"hayConflicto": hayConflicto, "conflictosEncontrados": conflictosEncontrados, "mensaje": "OK"}
