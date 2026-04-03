import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Menu, X, GraduationCap, User, LogOut,
  LayoutDashboard, DoorOpen, BookOpen, History, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  const [userType, setUserType]     = useState<string>("");
  const [fullName, setFullName]     = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedType = localStorage.getItem("userType") || "student";
    const storedName = localStorage.getItem("fullName") || "";
    setUserType(storedType);
    setFullName(storedName);

    // Cargar conteo de notificaciones (solo estudiantes)
    if (storedType === "student") {
      const fetchNotifs = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const res = await fetch("/auth/student/notifications", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const saved   = localStorage.getItem("pita_read_notifs");
            const readIds = saved ? JSON.parse(saved) : [];
            setUnreadCount(data.filter((n: any) => !readIds.includes(n.id)).length);
          }
        } catch {}
      };
      fetchNotifs();
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Navegación por rol ──────────────────────────────────────────────────────
  const studentNav = [
    { path: "/index",         label: "Inicio",            icon: <LayoutDashboard size={15} /> },
    { path: "/rooms",         label: "Salones",           icon: <DoorOpen size={15} />        },
    { path: "/schedule",      label: "Mi Horario",        icon: <BookOpen size={15} />        },
    { path: "/history",       label: "Mis Tutorías",      icon: <History size={15} />         },
  ];

  const tutorNav = [
    { path: "/index",  label: "Inicio",         icon: <LayoutDashboard size={15} /> },
    { path: "/rooms",  label: "Salones",         icon: <DoorOpen size={15} />        },
    { path: "/tutor",  label: "Panel de Tutor",  icon: <BookOpen size={15} />        },
  ];

  const adminNav = [
    { path: "/admin",          label: "Panel Admin", icon: <Shield size={15} />         },
    { path: "/admin#usuarios", label: "Usuarios",    icon: <LayoutDashboard size={15} /> },
    { path: "/admin#tutorias", label: "Tutorías",    icon: <BookOpen size={15} />        },
    { path: "/admin#salones",  label: "Salones",     icon: <DoorOpen size={15} />        },
  ];

  const navItems = userType === "admin" ? adminNav : userType === "tutor" ? tutorNav : studentNav;
  const profilePath = userType === "tutor" ? "/tutor/profile" : "/profile";

  // Avatar con inicial del nombre
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "U";

  // Color del avatar según rol
  const avatarBg = userType === "admin" ? "bg-[#6B2D8B]" : userType === "tutor" ? "bg-[#8DC63F]" : "bg-white/20";

  const isActive = (path: string) => location.pathname === path.split("#")[0];

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Banda UNAB */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00AEEF, #0090C5, #6B2D8B)" }} />

      {/* Barra principal */}
      <div className="bg-[#0090C5] text-white">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">

          {/* Logo */}
          <Link
            to={userType === "admin" ? "/admin" : "/index"}
            className="flex items-center gap-2.5 select-none group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 group-hover:bg-white/25 transition-colors">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold tracking-tight leading-none">UNAB</p>
              <p className="text-[10px] text-white/70 leading-none">Plataforma de Tutorías</p>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Acciones derecha */}
          <div className="flex items-center gap-1.5">

            {/* Notificaciones (solo no-admin) */}
            {userType !== "admin" && (
              <Link to="/notifications" aria-label="Notificaciones">
                <Button variant="ghost" size="icon"
                  className="relative h-9 w-9 text-white hover:bg-white/10 rounded-lg">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF9900] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Avatar / perfil */}
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

            {/* Nombre (desktop) */}
            {fullName && (
              <span className="hidden lg:block text-xs text-white/80 max-w-[100px] truncate">
                {fullName.split(" ")[0]}
              </span>
            )}

            {/* Logout */}
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </Button>

            {/* Hamburguesa móvil */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden h-9 w-9 text-white hover:bg-white/10 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0090C5] border-t border-white/20 pb-3 px-4 animate-fade-in">
          {/* Info usuario */}
          {fullName && (
            <div className="flex items-center gap-3 py-3 border-b border-white/20 mb-2">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm", avatarBg)}>
                {initial}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{fullName}</p>
                <p className="text-[10px] text-white/60 capitalize">{userType}</p>
              </div>
            </div>
          )}

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
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