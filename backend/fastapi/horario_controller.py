from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from pathlib import Path
import json
import datetime

HORARIOS_DIR = Path(__file__).parent / "horarios"
HORARIOS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()

class Bloque(BaseModel):
    day: str
    startTime: str
    endTime: str
    subject: str

@router.post("/{user_id}")
async def guardar_horario(user_id: str, bloques: list[Bloque] = Body(...)):
    data = {
        "userId": user_id,
        "fechaGuardado": datetime.datetime.utcnow().isoformat(),
        "horario": [b.dict() for b in bloques]
    }
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"message": "Horario guardado", "data": data}

@router.get("/{user_id}")
async def obtener_horario(user_id: str):
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    if not path.exists():
        return {"userId": user_id, "fechaGuardado": None, "horario": []}
    return json.loads(path.read_text(encoding="utf-8"))

@router.post("/{user_id}/verificar")
async def verificar(user_id: str, fecha_sesion: str = Body(...), duracion_minutos: int = Body(...)):
    path = HORARIOS_DIR / f"horario_{user_id}.json"
    if not path.exists():
        return {"hayConflicto": False, "conflictosEncontrados": [], "mensaje": "No hay horario registrado aún"}

    horarioData = json.loads(path.read_text(encoding="utf-8"))
    try:
        sessionDate = datetime.datetime.fromisoformat(fecha_sesion)
    except Exception:
        raise HTTPException(status_code=400, detail="fecha_sesion debe ser ISO format: YYYY-MM-DDTHH:MM")

    dayName = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"][sessionDate.weekday()]
    sessionStartInMinutes = sessionDate.hour * 60 + sessionDate.minute
    sessionEndInMinutes = sessionStartInMinutes + duracion_minutos

    hayConflicto = False
    conflictosEncontrados = []

    for bloque in horarioData.get("horario", []):
        if bloque.get("day", "").lower() == dayName:
            sh, sm = map(int, bloque.get("startTime").split(":"))
            eh, em = map(int, bloque.get("endTime").split(":"))
            startTimeInMinutes = sh * 60 + sm
            endTimeInMinutes = eh * 60 + em
            if not (sessionEndInMinutes <= startTimeInMinutes or sessionStartInMinutes >= endTimeInMinutes):
                hayConflicto = True
                conflictosEncontrados.append({
                    "dia": bloque.get("day"),
                    "materia": bloque.get("subject"),
                    "horaInicio": bloque.get("startTime"),
                    "horaFin": bloque.get("endTime")
                })

    return {"hayConflicto": hayConflicto, "conflictosEncontrados": conflictosEncontrados, "mensaje": "OK"}
