Servidor FastAPI mínimo para la funcionalidad de horarios

Instrucciones (Windows PowerShell):

1) Ir a la carpeta del servidor:

   cd backend\fastapi

2) Crear y activar un virtualenv (PowerShell):

   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   (si usas cmd.exe: .\.venv\Scripts\activate )

3) Instalar dependencias:

   pip install -r requirements.txt

4) Ejecutar el servidor en modo desarrollo:

   uvicorn main:app --reload --host 127.0.0.1 --port 8000

Endpoints disponibles:
- GET  /api/horario/{user_id}         -> obtener horario (JSON)
- POST /api/horario/{user_id}         -> guardar horario (envía array de bloques)
- POST /api/horario/{user_id}/verificar -> verificar conflicto (body: fecha_sesion ISO, duracion_minutos)

Notas:
- Los horarios se guardan en JSON dentro de `backend/fastapi/horarios/`.
- CORS está habilitado de forma abierta para facilitar desarrollo local; limitar orígenes en producción.
