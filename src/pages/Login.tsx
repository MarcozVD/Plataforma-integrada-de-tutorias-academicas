/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PÁGINA: LOGIN
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Página de autenticación para ingresar a la plataforma.
 *   Solicita número de estudiante y contraseña.
 *   Valida credenciales con backend y guarda token JWT.
 * 
 * FLUJO:
 *   1. Usuario ingresa número de estudiante y contraseña
 *   2. Click en "Iniciar sesión" dispara handleSubmit
 *   3. POST a /auth/login con credenciales
 *   4. Si OK: guarda token y datos en localStorage, navega a /index o /admin
 *   5. Si error: muestra mensaje de error
 *   6. Opción de recordar estudiante ID en localStorage
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, School, GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * COMPONENTE: Login
 * 
 * PROPÓSITO: Página de iniciar sesión de la aplicación
 */
const Login = () => {
  /**
   * HOOKS: Navegación y tema
   */
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  /**
   * ESTADO: Formulario de login
   * 
   * - studentId: Número de estudiante (puede venir de localStorage si fue recordado)
   * - password: Contraseña ingresada
   * - isLoading: True mientras se procesa el login (para deshabilitar botón)
   * - error: Mensaje de error si falla el login
   * - rememberMe: Checkbox para recordar el ID de estudiante
   */
  const [studentId, setStudentId] = useState(() => localStorage.getItem("rememberedStudentId") || "");
  const [password, setPassword]   = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("rememberedStudentId"));

  /**
   * FUNCIÓN: handleSubmit
   * 
   * PROPÓSITO: Procesa el formulario de login
   * 
   * FLUJO:
   *   1. e.preventDefault() previene recarga de página
   *   2. Set isLoading=true para mostrar spinner
   *   3. POST a /auth/login con { university_id, password }
   *   4. Valida que response es JSON (chequea backend está vivo)
   *   5. Si error en response: lanza excepción con data.detail
   *   6. Si rememberMe: guarda studentId en localStorage
   *   7. Guarda en localStorage:
   *      - token: JWT access token
   *      - studentId: Número de estudiante
   *      - userType: "student" | "tutor" | "admin" (determina rutas permitidas)
   *      - fullName: Nombre completo
   *      - carrera: Carrera/programa académico
   *   8. Navega a /admin si es admin, si no a /index
   *   9. Si error: muestra en pantalla
   *   10. Finalmente set isLoading=false
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Fetch a endpoint de login
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university_id: studentId, password }),
      });
      
      // Validar que el backend respondió con JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no respondió correctamente. ¿Está encendido el backend?");
      }
      
      // Parsear respuesta
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Credenciales inválidas");

      // Guardar o eliminar recordación de student ID
      if (rememberMe) {
        localStorage.setItem("rememberedStudentId", studentId);
      } else {
        localStorage.removeItem("rememberedStudentId");
      }

      // Guardar datos de sesión en localStorage
      localStorage.setItem("token",    data.access_token);      // JWT token para Authorization header
      localStorage.setItem("studentId", studentId);             // ID del usuario
      localStorage.setItem("userType",  data.user_type);        // Rol: student/tutor/admin
      localStorage.setItem("fullName",  data.full_name);        // Nombre para mostrar en Header
      localStorage.setItem("carrera",   data.carrera || "");    // Carrera del usuario

      // Navegar según rol
      if (data.user_type === "admin") navigate("/admin");
      else navigate("/index");
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F4FB] via-white to-[#EEF7E0] dark:from-[#07101a] dark:via-[#0a1624] dark:to-[#0c1a10] flex items-center justify-center px-4 py-12 relative">

      {/* BOTÓN: Toggle dark mode (esquina superior derecha) */}
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="absolute top-4 right-4 flex items-center justify-center h-9 w-9 rounded-full bg-white/70 dark:bg-white/10 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/15 transition-all shadow-sm"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md">

        {/* HEADER: Logo UNAB y título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00AEEF] shadow-md">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-foreground tracking-tight">UNAB</p>
              <p className="text-xs text-muted-foreground leading-none">Plataforma de Tutorías</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Universidad Autónoma de Bucaramanga</p>
        </div>

        {/* TARJETA DE LOGIN */}
        <Card className="shadow-lg border border-border/60">
          
          {/* HEADER: Título y descripción con gradiente */}
          <CardHeader className="rounded-t-lg pb-4 dark:[background:linear-gradient(135deg,#0a4a6e_0%,#083854_60%,#2d1240_100%)]" style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
            <CardTitle className="text-xl text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-blue-100 text-sm">Accede con tu número de estudiante</CardDescription>
          </CardHeader>

          {/* CONTENIDO: Formulario */}
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* ALERTA DE ERROR (si existe) */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              {/* CAMPO: Número de estudiante */}
              <div className="space-y-1.5">
                <label htmlFor="login-id" className="text-sm font-medium text-foreground">Número de estudiante</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input 
                    id="login-id" 
                    type="text" 
                    placeholder="U00123456" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)} 
                    className="pl-9" 
                    required 
                    autoComplete="username" 
                  />
                </div>
              </div>

              {/* CAMPO: Contraseña */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-9" 
                    required 
                    autoComplete="current-password" 
                  />
                </div>
              </div>

              {/* CONTROLES: Recuérdame y Olvide contraseña */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded accent-[#00AEEF]"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-muted-foreground">Recuérdame</span>
                </label>
                <Link to="/forgot-password" className="text-[#00AEEF] hover:text-[#0090C5] font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* BOTÓN: Iniciar sesión */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full text-white font-semibold py-2 mt-2" 
                style={{ backgroundColor: "#00AEEF" }}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            {/* SEPARADOR: "O" */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">O</span>
              </div>
            </div>

            {/* ENLACE: Registro */}
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-[#00AEEF] hover:text-[#0090C5] font-semibold">Regístrate aquí</Link>
            </p>
          </CardContent>
        </Card>

        {/* DISCLAIMER: Términos de servicio */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Al ingresar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
};

export default Login;
