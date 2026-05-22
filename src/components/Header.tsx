/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: Header - Barra de navegación principal
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Barra de navegación superior de la aplicación. Muestra links de navegación
 *   según el rol del usuario (estudiante, tutor, admin), avatar, notificaciones,
 *   toggle de tema oscuro/claro, logout y menú móvil hamburguesa.
 * 
 * FLUJO:
 *   1. Lee tipo de usuario y nombre de localStorage
 *   2. Carga conteo de notificaciones no leídas (solo estudiantes, cada 60s)
 *   3. Renderiza navegación según rol (studentNav, tutorNav, adminNav)
 *   4. Muestra controles: notificaciones, avatar, toggle tema, logout
 *   5. En móvil: menú hamburguesa desplegable
 * 
 * ROLES:
 *   - student: Inicio, Salones, Mi Horario, Mis Tutorías + Notificaciones + Avatar
 *   - tutor: Inicio, Salones, Panel de Tutor + Notificaciones + Avatar
 *   - admin: Panel Admin, Tutorías, Salones (sin notificaciones ni avatar)
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Menu, X, GraduationCap, LogOut,
  LayoutDashboard, DoorOpen, BookOpen, History, Shield, Moon, Sun,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * COMPONENTE: Header
 * 
 * PROPÓSITO: Renderiza la barra de navegación principal con controles de usuario
 * 
 * ESTADOS:
 *   - mobileOpen: Controla si el menú móvil está abierto
 *   - userType: Tipo de usuario (student | tutor | admin)
 *   - fullName: Nombre completo del usuario
 *   - unreadCount: Cantidad de notificaciones no leídas
 */
const Header = () => {
  // Estado para controlar el menú hamburguesa en móvil
  const [mobileOpen, setMobileOpen] = useState(false);
  // Hook de React Router para obtener la ruta actual
  const location  = useLocation();
  // Hook de React Router para navegar programáticamente
  const navigate  = useNavigate();
  // Hook personalizado para acceder al tema actual y la función de toggle
  const { theme, toggleTheme } = useTheme();

  // Estados del usuario cargados desde localStorage
  const [userType, setUserType]     = useState<string>("");
  const [fullName, setFullName]     = useState<string>("");
  // Contador de notificaciones no leídas (solo para estudiantes)
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * EFECTO: Cargar datos del usuario y notificaciones
   * 
   * FLUJO:
   *   1. Lee tipo de usuario y nombre de localStorage
   *   2. Si es estudiante:
   *      a. Consulta notificaciones al backend (GET /auth/student/notifications)
   *      b. Compara con IDs de notificaciones leídas guardadas en localStorage
   *      c. Calcula conteo de no leídas
   *      d. Repite cada 60 segundos (polling)
   *   3. Se re-ejecuta cuando cambia la ruta (location.pathname)
   * 
   * DEPENDENCIAS: location.pathname (se actualiza al navegar)
   */
  useEffect(() => {
    const storedType = localStorage.getItem("userType") || "student";
    const storedName = localStorage.getItem("fullName") || "";
    setUserType(storedType);
    setFullName(storedName);

    // Cargar conteo de notificaciones (solo estudiantes) + polling cada 60s
    if (storedType === "student") {
      /**
       * FUNCIÓN: fetchNotifs
       * 
       * PROPÓSITO: Obtiene notificaciones del backend y calcula las no leídas
       * 
       * FLUJO:
       *   1. Obtiene token JWT de localStorage
       *   2. Hace GET a /auth/student/notifications con el token
       *   3. Lee IDs de notificaciones leídas de localStorage (pita_read_notifs)
       *   4. Filtra las notificaciones que NO están en la lista de leídas
       *   5. Actualiza el contador de no leídas
       */
      const fetchNotifs = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const res = await fetch("/auth/student/notifications", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data    = await res.json();
            const saved   = localStorage.getItem("pita_read_notifs");
            const readIds = saved ? JSON.parse(saved) : [];
            setUnreadCount(data.filter((n: any) => !readIds.includes(n.id)).length);
          }
        } catch {}
      };
      fetchNotifs();
      // Polling: consulta notificaciones cada 60 segundos
      const interval = setInterval(fetchNotifs, 60_000);
      // Cleanup: limpia el intervalo cuando el componente se desmonta o cambia la ruta
      return () => clearInterval(interval);
    }
  }, [location.pathname]);

  /**
   * FUNCIÓN: handleLogout
   * 
   * PROPÓSITO: Cierra la sesión del usuario
   * 
   * FLUJO:
   *   1. Limpia todo el localStorage (token, userType, fullName, etc.)
   *   2. Navega a la página de login ("/")
   */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Definición de navegación por rol ──────────────────────────────────────
  
  /**
   * Links de navegación para ESTUDIANTES
   * Incluye: Inicio, Salones, Mi Horario, Mis Tutorías
   */
  const studentNav = [
    { path: "/index",         label: "Inicio",            icon: <LayoutDashboard size={15} /> },
    { path: "/rooms",         label: "Salones",           icon: <DoorOpen size={15} />        },
    { path: "/schedule",      label: "Mi Horario",        icon: <BookOpen size={15} />        },
    { path: "/history",       label: "Mis Tutorías",      icon: <History size={15} />         },
  ];

  /**
   * Links de navegación para TUTORES
   * Incluye: Inicio, Salones, Panel de Tutor
   */
  const tutorNav = [
    { path: "/index",  label: "Inicio",         icon: <LayoutDashboard size={15} /> },
    { path: "/rooms",  label: "Salones",         icon: <DoorOpen size={15} />        },
    { path: "/tutor",  label: "Panel de Tutor",  icon: <BookOpen size={15} />        },
  ];

  /**
   * Links de navegación para ADMINISTRADORES
   * Incluye: Panel Admin, Tutorías, Salones
   * Los hashes (#tutorias, #salones) navegan a secciones dentro del panel admin
   */
  const adminNav = [
    { path: "/admin",          label: "Panel Admin", icon: <Shield size={15} />         },
    { path: "/admin#tutorias", label: "Tutorías",    icon: <BookOpen size={15} />        },
    { path: "/admin#salones",  label: "Salones",     icon: <DoorOpen size={15} />        },
  ];

  // Selecciona los items de navegación según el rol del usuario
  const navItems = userType === "admin" ? adminNav : userType === "tutor" ? tutorNav : studentNav;
  // Ruta al perfil según el rol (tutores tienen ruta diferente)
  const profilePath = userType === "tutor" ? "/tutor/profile" : "/profile";

  // Avatar: primera letra del nombre en mayúscula, o "U" si no hay nombre
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "U";

  // Color de fondo del avatar según rol
  // Admin: púrpura UNAB, Tutor: verde, Estudiante: blanco semitransparente
  const avatarBg = userType === "admin" ? "bg-[#6B2D8B]" : userType === "tutor" ? "bg-[#8DC63F]" : "bg-white/20";

  /**
   * FUNCIÓN: isActive
   * 
   * PROPÓSITO: Determina si una ruta de navegación es la actualmente activa
   * 
   * @param path - Ruta a comparar (puede incluir hash como "/admin#tutorias")
   * @returns true si la ruta base coincide con location.pathname
   */
  const isActive = (path: string) => location.pathname === path.split("#")[0];

  return (
    <header className="sticky top-0 z-50 w-full shadow-md dark:shadow-none">
      {/* ── Barra principal de navegación ── */}
      {/* Fondo azul UNAB en modo claro, oscuro en dark mode */}

      {/* Barra principal */}
      <div className="bg-[#0090C5] dark:bg-[#0d1f2d] text-white border-b border-transparent dark:border-white/5">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">

          {/* ── Logo UNAB (izquierda) ── */}
          {/* Navega al inicio según rol: admin → /admin, otros → /index */}
          <Link
            to={userType === "admin" ? "/admin" : "/index"}
            className="flex items-center gap-2.5 select-none group"
          >
            {/* Icono de graduación en contenedor redondeado */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 group-hover:bg-white/25 transition-colors">
              <GraduationCap size={18} className="text-white" />
            </div>
            {/* Texto del logo (oculto en pantallas pequeñas) */}
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold tracking-tight leading-none">UNAB</p>
              <p className="text-[10px] text-white/70 leading-none">Plataforma de Tutorías</p>
            </div>
          </Link>

          {/* ── Navegación desktop (centro) ── */}
          {/* Solo visible en pantallas md+ (≥768px) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-white/20 text-white"       // Estilo activo: fondo blanco semitransparente
                    : "text-white/80 hover:bg-white/10 hover:text-white"  // Estilo inactivo
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ── Acciones derecha ── */}
          <div className="flex items-center gap-1.5">

            {/* Botón de notificaciones (solo para no-admin) */}
            {userType !== "admin" && (
              <Link to="/notifications" aria-label="Notificaciones">
                <Button variant="ghost" size="icon"
                  className="relative h-9 w-9 text-white hover:bg-white/10 rounded-lg">
                  <Bell size={18} />
                  {/* Badge con conteo de notificaciones no leídas */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF9900] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Avatar con inicial del usuario (solo para no-admin) */}
            {userType !== "admin" && (
              <Link to={profilePath} aria-label="Perfil">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity",
                  avatarBg
                )}>
                  {initial}
                </div>
              </Link>
            )}

            {/* Nombre del usuario (solo visible en desktop lg+) */}
            {fullName && (
              <span className="hidden lg:block text-xs text-white/80 max-w-[100px] truncate">
                {fullName.split(" ")[0]}
              </span>
            )}

            {/* Botón toggle de tema oscuro/claro */}
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {/* Muestra Sun en dark mode, Moon en light mode */}
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Botón de cerrar sesión */}
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </Button>

            {/* Botón hamburguesa para menú móvil (visible solo en < md) */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden h-9 w-9 text-white hover:bg-white/10 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {/* Cambia icono: X cuando está abierto, Menu cuando está cerrado */}
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Menú móvil desplegable ── */}
      {/* Solo se muestra cuando mobileOpen es true y en pantallas < md */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0090C5] dark:bg-[#0d1f2d] border-t border-white/20 pb-3 px-4 animate-fade-in">
          {/* Información del usuario en el menú móvil */}
          {fullName && (
            <div className="flex items-center gap-3 py-3 border-b border-white/20 mb-2">
              {/* Avatar con inicial */}
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm", avatarBg)}>
                {initial}
              </div>
              {/* Nombre y rol */}
              <div>
                <p className="text-sm font-semibold text-white">{fullName}</p>
                <p className="text-[10px] text-white/60 capitalize">{userType}</p>
              </div>
            </div>
          )}

          {/* Links de navegación móvil */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}  // Cierra el menú al navegar
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mt-0.5 transition-colors",
                isActive(item.path)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Botón de cerrar sesión en menú móvil */}
          <div className="border-t border-white/20 mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;