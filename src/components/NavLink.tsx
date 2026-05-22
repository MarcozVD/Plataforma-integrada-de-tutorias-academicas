/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: NavLink - Enlace de navegación con estados activo/pendiente
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Wrapper sobre NavLink de React Router que simplifica el uso de clases
 *   CSS para los estados "activo" (ruta actual) y "pendiente" (cargando).
 * 
 * FLUJO:
 *   1. Recibe props como className, activeClassName y pendingClassName
 *   2. Usa NavLink de react-router-dom internamente
 *   3. Aplica clases dinámicamente según el estado de la ruta
 *   4. Utiliza cn() para combinar clases de forma segura con Tailwind
 * 
 * USO:
 *   <NavLink to="/dashboard" className="link" activeClassName="link-active">
 *     Dashboard
 *   </NavLink>
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * INTERFAZ: NavLinkCompatProps
 * 
 * Extiende NavLinkProps de React Router pero redefine className como string
 * simple (en vez de función) y agrega activeClassName y pendingClassName
 * para una API más sencilla similar al NavLink clásico de React Router v5.
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;           // Clases CSS base (siempre aplicadas)
  activeClassName?: string;     // Clases CSS cuando la ruta coincide (activa)
  pendingClassName?: string;    // Clases CSS cuando la ruta está cargando (pendiente)
}

/**
 * COMPONENTE: NavLink (con forwardRef)
 * 
 * PROPÓSITO: Enlace de navegación que aplica clases CSS según el estado de la ruta
 * 
 * FLUJO:
 *   1. Recibe className, activeClassName y pendingClassName como props
 *   2. Internamente usa RouterNavLink que provee isActive e isPending
 *   3. cn() combina las clases base + activa (si isActive) + pendiente (si isPending)
 *   4. Pasa el ref al elemento <a> del RouterNavLink
 * 
 * @param className - Clases base siempre aplicadas
 * @param activeClassName - Clases aplicadas cuando la ruta es la actual
 * @param pendingClassName - Clases aplicadas cuando la navegación está pendiente
 * @param to - Ruta destino del enlace
 * @param ref - Ref forwarded al elemento anchor nativo
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // className como función: React Router provee isActive e isPending
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

// Display name para React DevTools
NavLink.displayName = "NavLink";

export { NavLink };
