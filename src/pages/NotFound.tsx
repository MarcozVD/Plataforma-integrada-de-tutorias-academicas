/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PÁGINA: NotFound (404)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Página de error 404 que se muestra cuando el usuario intenta acceder
 *   a una ruta que no existe en la aplicación.
 * 
 * FLUJO:
 *   1. Se renderiza cuando ninguna otra ruta coincide (Route path="*" en App.tsx)
 *   2. Registra error 404 en consola con la ruta intentada
 *   3. Muestra mensaje de error y enlace para volver al inicio
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * COMPONENTE: NotFound
 * 
 * PROPÓSITO: Muestra una página de error 404 amigable al usuario
 * 
 * FLUJO:
 *   1. Obtiene la ruta actual con useLocation()
 *   2. Registra en consola la ruta no encontrada (para debugging)
 *   3. Renderiza interfaz con mensaje de error y enlace de retorno
 */
const NotFound = () => {
  // Obtiene información de la ruta actual (pathname) para logging
  const location = useLocation();

  /**
   * EFECTO: Registro de error 404 en consola
   * 
   * Se ejecuta cuando cambia la ruta. Útil para depuración y monitoreo
   * de rutas incorrectas que los usuarios intentan acceder.
   */
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Renderiza la interfaz de error 404
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        {/* Código de error grande y visible */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Mensaje descriptivo */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* Enlace para regresar al inicio (login) */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
