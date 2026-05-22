/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PROVEEDOR DE TEMA (Light/Dark Mode)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Provee sistema global de temas (claro/oscuro).
 *   Persiste la preferencia en localStorage.
 * 
 * FLUJO:
 *   1. Lee tema de localStorage al iniciar
 *   2. Aplica clase "dark" al elemento html
 *   3. useTheme() hook permite acceder a theme y toggleTheme desde cualquier componente
 */

import { createContext, useContext, useEffect, useState } from "react";

/**
 * TIPO: Tema válido (light o dark)
 */
type Theme = "light" | "dark";

/**
 * CONTEXTO: ThemeContext
 * 
 * Proporciona:
 *   - theme: tema actual ("light" | "dark")
 *   - toggleTheme: función para cambiar de tema
 */
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "light",
  toggleTheme: () => {},
});

/**
 * HOOK: useTheme
 * 
 * PROPÓSITO: Acceder al contexto de tema desde cualquier componente
 * 
 * USO:
 *   const { theme, toggleTheme } = useTheme();
 */
export const useTheme = () => useContext(ThemeContext);

/**
 * COMPONENTE: ThemeProvider
 * 
 * PROPÓSITO: Proveedor raíz que gestiona el tema global
 * 
 * FLUJO:
 *   1. useState con inicializador: Lee de localStorage ("pita_theme") o "light" por defecto
 *   2. useEffect: Aplica clase "dark" al html cuando cambia tema y guarda en localStorage
 *   3. toggleTheme: Cambia entre "light" y "dark"
 *   4. Envuelve children con ThemeContext.Provider
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  /**
   * ESTADO: Theme actual
   * 
   * Se inicializa desde localStorage para persistencia.
   * Valor por defecto: "light"
   */
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("pita_theme") as Theme) ?? "light"
  );

  /**
   * EFECTO: Aplica tema al DOM y persiste en localStorage
   * 
   * FLUJO:
   *   1. Si theme === "dark": añade clase "dark" al <html>
   *   2. Si theme === "light": remueve clase "dark"
   *   3. Guarda tema en localStorage bajo "pita_theme"
   *   4. Se ejecuta cuando theme cambia
   * 
   * NOTA: Tailwind CSS detecta clase "dark" en <html> para aplicar estilos dark
   */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pita_theme", theme);
  }, [theme]);

  /**
   * FUNCIÓN: toggleTheme
   * 
   * Alterna entre tema claro y oscuro
   * Si está en "light" → cambia a "dark"
   * Si está en "dark" → cambia a "light"
   */
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  /**
   * RENDERIZADO
   * 
   * Proporciona el contexto a todos los children
   * Cualquier componente dentro puede usar useTheme() para acceder
   */
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
