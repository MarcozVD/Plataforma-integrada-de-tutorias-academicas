import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, School, GraduationCap } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword]   = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university_id: studentId, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Credenciales inválidas");

      // Lógica original del compañero — guardar en localStorage
      localStorage.setItem("token",    data.access_token);
      localStorage.setItem("studentId", studentId);
      localStorage.setItem("userType",  data.user_type);
      localStorage.setItem("fullName",  data.full_name);
      localStorage.setItem("carrera",   data.carrera || "");

      if (data.user_type === "admin") navigate("/admin");
      else navigate("/index");
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F4FB] via-white to-[#EEF7E0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo UNAB */}
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

        <Card className="shadow-lg border border-border/60">
          <CardHeader className="rounded-t-lg pb-4" style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
            <CardTitle className="text-xl text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-blue-100 text-sm">Accede con tu número de estudiante</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Número de estudiante</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="U00123456" value={studentId}
                    onChange={(e) => setStudentId(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#00AEEF]" />
                  <span className="text-muted-foreground">Recuérdame</span>
                </label>
                <a href="#" className="text-[#00AEEF] hover:text-[#0090C5] font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full text-white font-semibold py-2 mt-2" style={{ backgroundColor: "#00AEEF" }}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">O</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-[#00AEEF] hover:text-[#0090C5] font-semibold">Regístrate aquí</Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Al ingresar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
};

export default Login;
