# Plataforma Integrada de Tutorías Académicas 🎓

Una solución web moderna y robusta diseñada para centralizar y optimizar la gestión de tutorías académicas universitarias. Esta plataforma conecta a estudiantes con tutores, facilitando la programación de sesiones, la reserva de espacios físicos adaptados y el seguimiento académico.

## 🌟 Características Principales

### 👤 Gestión de Usuarios y Roles
- **Sistema de Autenticación**: Registro e inicio de sesión seguro mediante JWT.
- **Roles Diferenciados**:
  - **Estudiantes**: Pueden inscribirse en tutorías, gestionar sus preferencias académicas y ver su historial.
  - **Tutores**: Capacidad para crear sesiones de tutoría, gestionar horarios y visualizar sus inscritos.
  - **Administradores**: Control total sobre la infraestructura (bloques, salones) y supervisión del sistema.

### 📅 Programación y Tutorías
- **Gestión de Sesiones**: Creación de tutorías con especificación de materia, fecha, hora, duración y cupos.
- **Inscripción Inteligente**: Los estudiantes pueden buscar y anotarse en tutorías disponibles según sus intereses.
- **Control de Conflictos**: Algoritmo que verifica la disponibilidad horaria del estudiante antes de permitir una inscripción.
- **Historial de Actividad**: Seguimiento detallado de tutorías pasadas y futuras.

### 🏛️ Gestión de Espacios (Salones)
- **Inventario Detallado**: Registro de bloques universitarios y salones con capacidad específica.
- **Filtros de Accesibilidad**: Soporte para identificar salones con acceso para sillas de ruedas, ayudas visuales y auditivas.
- **Disponibilidad Dinámica**: Los administradores pueden definir horarios de disponibilidad recurrentes o fechas específicas para cada salón.

### ♿ Inclusión y Accesibilidad
- **Perfiles Sensibles**: Registro opcional de tipos de discapacidad para asegurar que las tutorías se asignen a espacios adecuados.
- **Preferencias Personalizadas**: Los estudiantes pueden marcar sus materias de interés para recibir una experiencia más personalizada.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** (Vite)
- **TypeScript** para un desarrollo tipado y seguro.
- **Tailwind CSS** para un diseño moderno y responsivo.
- **shadcn/ui** para componentes de interfaz de usuario consistentes y accesibles.
- **Lucide React** para iconografía.

### Backend
- **FastAPI** (Python 3.10+) para una API de alto rendimiento.
- **SQLAlchemy** como ORM para la gestión de base de datos.
- **Pydantic** para la validación de esquemas de datos.
- **Mysql** como base de datos por defecto (fácil de migrar a PostgreSQL/SQL Server).

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/MarcozVD/Plataforma-integrada-de-tutorias-academicas.git
cd Plataforma-integrada-de-tutorias-academicas
```

### 2. Configuración del Backend (FastAPI)
Es recomendable usar un entorno virtual:
```bash
cd backend/fastapi
python -m venv .venv
# En Windows:
.\.venv\Scripts\Activate.ps1
# En Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
# El servidor iniciará y creará la base de datos automáticamente
python main.py
```
*El backend estará disponible en `http://127.0.0.1:8000`*

### 3. Configuración del Frontend (React)
Asegúrate de tener **Node.js** instalado:
```bash
# Regresar a la raíz del proyecto
npm install
npm run dev
```
*El frontend estará disponible en `http://localhost:8080` (o el puerto que asigne Vite)*

---

## 📁 Estructura del Proyecto

```text
├── backend/
│   └── fastapi/
│       ├── auth_controller.py     # Lógica de usuarios y sesiones
│       ├── horario_controller.py  # Gestión de calendarios
│       ├── models.py              # Definición de tablas de BD
│       ├── main.py                # Punto de entrada del servidor
│       └── db.py                  # Configuración de base de datos
├── src/
│   ├── components/                # Componentes reutilizables de UI
│   ├── pages/                     # Vistas principales (Admin/Tutor/Estudiante)
│   ├── hooks/                     # Custom hooks de React
│   └── App.tsx                    # Enrutamiento principal
├── public/                        # Activos estáticos
└── tailwind.config.ts             # Configuración de estilos
```

---

## 📝 Notas de Desarrollo
- La plataforma utiliza una arquitectura separada (Frontend desacoplado del Backend).
- La base de datos se inicializa automáticamente al arrancar el backend por primera vez.
- Para producción, se recomienda configurar variables de entorno para la `SECRET_KEY` de seguridad.

---
*Desarrollado para mejorar la experiencia educativa universitaria.*
