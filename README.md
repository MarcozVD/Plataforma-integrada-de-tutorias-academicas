# Plataforma Integrada de Tutorías Académicas 🎓

Una solución de escritorio moderna y robusta diseñada para centralizar y optimizar la gestión de tutorías académicas universitarias. Esta aplicación (construida con Electron y React) conecta a estudiantes con tutores, facilitando la programación de sesiones, la reserva de espacios físicos adaptados y el seguimiento académico.

## 🌟 Características Principales

### 👤 Gestión de Usuarios y Roles
- **Sistema de Autenticación**: Registro e inicio de sesión seguro.
- **Roles Diferenciados**:
  - **Estudiantes**: Pueden inscribirse en tutorías, gestionar sus preferencias académicas y usar un Chatbot asistente.
  - **Tutores**: Capacidad para crear sesiones de tutoría, gestionar horarios y visualizar sus inscritos.
  - **Administradores**: Control total sobre la infraestructura (bloques, salones) y supervisión del sistema.

### 📅 Programación y Tutorías
- **Gestión de Sesiones**: Creación de tutorías con especificación de materia, fecha, hora, duración y cupos.
- **Inscripción Inteligente**: Los estudiantes pueden buscar y anotarse en tutorías disponibles según sus intereses.
- **Historial de Actividad**: Seguimiento detallado de tutorías pasadas y futuras.

### 💻 Interfaz Nativa de Escritorio
- **Diseño Integrado**: La aplicación cuenta con una barra de título personalizada y controles nativos de ventana sin bordes para una experiencia moderna.
- **Rendimiento**: Empaquetado como ejecutable ligero combinando lo mejor del ecosistema web nativo en escritorio.

---

## 🛠️ Tecnologías Utilizadas

### Aplicación de Escritorio (Frontend)
- **Electron**: Para empaquetado nativo de Windows/macOS.
- **React 18** (Vite) + **TypeScript**.
- **Tailwind CSS** para un diseño moderno y responsivo.
- **shadcn/ui** para componentes de interfaz consistentes.
- **Lucide React** para iconografía y barras de control.

### Servidor (Backend)
- **FastAPI** (Python 3.10+) para una API de alto rendimiento.
- **SQLAlchemy** como ORM para la gestión de base de datos.
- **Pydantic** para la validación de esquemas de datos.
- **MySQL/MariaDB** como motor de base de datos base.

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/MarcozVD/Plataforma-integrada-de-tutorias-academicas.git
cd Plataforma-integrada-de-tutorias-academicas
```

### 2. Iniciar el Servidor API (Backend)
Es necesario tener el servidor base corriendo para procesar los datos de la app de escritorio.
```bash
cd backend/fastapi
python -m venv .venv
# En Windows:
.\.venv\Scripts\Activate.ps1
# En Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```
*El backend se ejecutará en local bajo la red `http://127.0.0.1:8000` y conectará con la aplicación.*

### 3. Compilar la Aplicación de Escritorio (Electron / React)
Abre otra terminal y asegúrate de tener **Node.js** instalado:
```bash
# En la raíz del proyecto
npm install

# Para probar la app en modo desarrollo (Live Reloading)
npm run dev

# Para compilar el Instalador Oficial (.exe para Windows)
npm run dist
```
*Al ejecutar `npm run dist`, Electron empaquetará el código y creará una carpeta llamada `release/` donde se encontrará el archivo instalador final `.exe`.*

---

## 📁 Estructura del Proyecto

```text
├── backend/
│   └── fastapi/                 # Servidor API y base de datos
├── electron/
│   ├── main.ts                  # Proceso principal (Sistema Operativo)
│   └── preload.ts               # Seguridad e Intercomunicación IPC
├── src/
│   ├── components/              # Componentes UI (TitleBar, Header, etc.)
│   ├── pages/                   # Vistas principales
│   └── App.tsx                  # Enrutamiento principal (HashRouter)
├── public/                      # Activos, íconos (.svg y .ico originales)
└── package.json                 # Dependencias y Configuración de electron-builder
```

---

## 📝 Notas de Desarrollo
- La plataforma ahora funciona explícitamente mediante rutas locales por su naturaleza de Escritorio (usa `HashRouter` internamente).
- Para la compilación formal del instalador, `electron-builder` utiliza el archivo `logo-unab.ico` como ícono del ejecutable. ¡Asegúrate de no borrarlo!
- La exportación oficial (`npm run dist`) en Windows requiere a veces de una consola Ejecutada como Administrador, esto permite los permisos de creación de enlaces nativos (`winCodeSign`).

---
*Desarrollado para mejorar la experiencia educativa universitaria.*
