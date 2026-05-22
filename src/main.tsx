/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PUNTO DE ENTRADA DE LA APLICACIÓN - Frontend Principal
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Inicializa la aplicación React e intercepta todas las peticiones fetch
 *   para redirigirlas al servidor backend durante desarrollo.
 * 
 * FLUJO:
 *   1. Intercepta función fetch global del navegador
 *   2. Detecta si request va a /auth o /api
 *   3. Redirige automáticamente a http://127.0.0.1:8000
 *   4. Monta componente App en elemento #root del HTML
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * INTERCEPTOR GLOBAL DE FETCH
 * 
 * RAZÓN: En desarrollo, frontend y backend corren en puertos diferentes:
 *   - Frontend: http://localhost:5173 (Vite dev server)
 *   - Backend: http://localhost:8000 (FastAPI)
 * 
 * Este interceptor redirige automáticamente las llamadas API al backend.
 */
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // Si el recurso es una URL string y comienza con /auth o /api
  if (typeof resource === 'string') {
    if (resource.startsWith('/auth') || resource.startsWith('/api')) {
      // Prepende la URL del backend
      resource = `http://147.15.137.230:8000${resource}`;
    }
  }
  
  // Realiza el fetch con la URL corregida
  return originalFetch(resource, config);
};

/**
 * INICIALIZACIÓN DE REACT
 * 
 * 1. Obtiene elemento #root del HTML
 * 2. Crea root de React en ese elemento
 * 3. Renderiza componente <App /> que es la aplicación principal
 */
createRoot(document.getElementById("root")!).render(<App />);
