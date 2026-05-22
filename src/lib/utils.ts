/**
 * ════════════════════════════════════════════════════════════════════════════════
 * UTILIDADES GENERALES DE LA APLICACIÓN
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Proporciona funciones utilitarias reutilizables en toda la aplicación.
 *   Actualmente contiene la función cn() para combinar clases de Tailwind CSS.
 * 
 * FLUJO:
 *   1. Importa clsx para combinar clases condicionalmente
 *   2. Importa twMerge para resolver conflictos de clases Tailwind
 *   3. Exporta cn() que combina ambas funcionalidades
 */

// clsx: Librería para construir strings de className de forma condicional
// ClassValue: Tipo que acepta strings, arrays, objetos, etc.
import { clsx, type ClassValue } from "clsx";
// twMerge: Resuelve conflictos entre clases de Tailwind (ej: "px-2 px-4" → "px-4")
import { twMerge } from "tailwind-merge";

/**
 * FUNCIÓN: cn (classNames)
 * 
 * PROPÓSITO: Combina múltiples clases CSS de Tailwind de forma inteligente
 * 
 * FLUJO:
 *   1. Recibe cualquier cantidad de valores de clase (strings, objetos, arrays)
 *   2. clsx() los combina en un solo string, evaluando condiciones
 *   3. twMerge() resuelve conflictos de Tailwind (última clase gana)
 * 
 * EJEMPLO DE USO:
 *   cn("px-2 py-1", isActive && "bg-blue-500", "text-white")
 *   // Si isActive es true: "px-2 py-1 bg-blue-500 text-white"
 *   // Si isActive es false: "px-2 py-1 text-white"
 * 
 * @param inputs - Lista de valores de clase CSS a combinar
 * @returns String con las clases combinadas y conflictos resueltos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
