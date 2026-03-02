from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from horario_controller import router as horario_router
from auth_controller import router as auth_router
from db import init_db
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="Plataforma Tutorias - FastAPI")

# Permitir llamadas desde el frontend (ajusta orígenes en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"[validation_error] {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.include_router(horario_router, prefix="/api/horario")
app.include_router(auth_router, prefix="/auth")


@app.get("/", include_in_schema=False)
async def root():
    # Redirige a la documentación interactiva por conveniencia
    return RedirectResponse(url="/docs")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # No tenemos un favicon estático; devolver vacío evita 404 en logs
    return Response(status_code=204)


@app.on_event("startup")
async def on_startup():
    # Crear tablas si no existen
    try:
        init_db()
        print("[startup] DB initialized successfully")
    except Exception as e:
        print("[startup] ERROR initializing DB:", e)
        raise

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
