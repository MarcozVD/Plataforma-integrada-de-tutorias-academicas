/**
 * ════════════════════════════════════════════════════════════════════════════════
 * HOOK: useIsMobile - Detección de dispositivo móvil
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Detecta si el usuario está en un dispositivo móvil basándose en el ancho
 *   de la ventana del navegador. Actualiza en tiempo real cuando se redimensiona.
 * 
 * FLUJO:
 *   1. Define breakpoint móvil (768px)
 *   2. Usa matchMedia para escuchar cambios de tamaño
 *   3. Actualiza estado cuando la ventana cruza el breakpoint
 *   4. Retorna boolean: true si es móvil, false si es desktop
 * 
 * USO:
 *   const isMobile = useIsMobile();
 *   // isMobile será true si ancho < 768px
 */

import * as React from "react";

/**
 * CONSTANTE: Breakpoint para considerar un dispositivo como móvil
 * 768px es el estándar de Tailwind para la clase "md:" (tablets hacia arriba)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * FUNCIÓN: useIsMobile
 * 
 * PROPÓSITO: Hook personalizado que retorna si el viewport es de tamaño móvil
 * 
 * FLUJO:
 *   1. Inicializa estado como undefined (aún no sabe)
 *   2. En el efecto, crea un MediaQueryList para escuchar cambios
 *   3. Registra listener que actualiza el estado cuando cambia el tamaño
 *   4. Evalúa inmediatamente el tamaño actual
 *   5. Limpia el listener cuando el componente se desmonta
 * 
 * @returns boolean - true si ancho de ventana < 768px (móvil), false si es desktop
 */
export function useIsMobile() {
  // Estado que almacena si es móvil. Inicia como undefined hasta que se evalúe
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Crea MediaQueryList que escucha cuando el ancho cruza el breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Callback que se ejecuta cuando cambia el tamaño de la ventana
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Registra el listener para cambios de tamaño
    mql.addEventListener("change", onChange);
    
    // Evalúa el tamaño actual inmediatamente al montar
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Cleanup: remueve el listener cuando el componente se desmonta
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Convierte undefined a false con doble negación (!!)
  return !!isMobile;
}
