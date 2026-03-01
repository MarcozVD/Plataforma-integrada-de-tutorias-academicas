import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, X, GraduationCap, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<string>("");

  useEffect(() => {
    // Cargar tipo de usuario del localStorage
    const storedUserType = localStorage.getItem("userType") || "student";
    setUserType(storedUserType);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Navegación para estudiantes
  const studentNavItems = [
    { path: "/", label: "Inicio" },
    { path: "/rooms", label: "Salones Disponibles" },
    { path: "/schedule", label: "Mi Horario" },
    { path: "/history", label: "Mis Tutorías" },
  ];

  // Navegación para tutores
  const tutorNavItems = [
    { path: "/", label: "Inicio" },
    { path: "/rooms", label: "Salones" },
    { path: "/schedule", label: "Horario" },
    { path: "/tutor", label: "Panel de Tutor" },
  ];

  // Usar la navegación según el tipo de usuario
  const navItems = userType === "tutor" ? tutorNavItems : studentNavItems;

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="h-7 w-7" />
          <span className="hidden sm:inline">Tutorías Académicas</span>
          <span className="sm:hidden">PITA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/notifications" aria-label="Notificaciones">
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-warning text-warning-foreground text-xs border-0">
                2
              </Badge>
            </Button>
          </Link>
          <Link to="/profile" aria-label="Perfil">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-primary-foreground/20 pb-3 px-4" role="navigation" aria-label="Menú móvil">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium mt-1 transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
