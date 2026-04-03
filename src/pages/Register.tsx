import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, User, ArrowRight, School, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "", email: "", studentId: "", password: "", confirmPassword: "",
    carrera: "", userType: "student", disabilityType: "none", disabilityDescription: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.fullName)  newErrors.fullName  = "El nombre es requerido";
    if (!formData.email)     newErrors.email     = "El correo es requerido";
    if (!formData.studentId) newErrors.studentId = "El número de estudiante es requerido";
    if (!formData.password)  newErrors.password  = "La contraseña es requerida";
    if (formData.password && formData.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true); setErrors({});
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName, email: formData.email,
          university_id: formData.studentId, password: formData.password,
          confirm_password: formData.confirmPassword, carrera: formData.carrera || null,
          user_type: formData.userType,
          disability_type: formData.disabilityType !== "none" ? formData.disabilityType : null,
          disability_description: formData.disabilityDescription || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Error al registrar usuario");
      // Lógica original del compañero — redirige al login
      navigate("/");
    } catch (error: any) {
      setErrors({ submit: error.message || "Error al conectar con el servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F4FB] via-white to-[#EEF7E0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
          <p className="text-sm text-muted-foreground">Únete a la comunidad académica</p>
        </div>

        <Card className="shadow-lg border border-border/60">
          <CardHeader className="rounded-t-lg pb-4" style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
            <CardTitle className="text-xl text-white">Crear cuenta</CardTitle>
            <CardDescription className="text-blue-100 text-sm">Completa tus datos para registrarte</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errors.submit}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" name="fullName" placeholder="Juan Pérez" value={formData.fullName}
                    onChange={handleChange} className={cn("pl-9", errors.fullName && "border-red-400")} required />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Número de estudiante</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" name="studentId" placeholder="U00123456" value={formData.studentId}
                    onChange={handleChange} className={cn("pl-9", errors.studentId && "border-red-400")} required />
                </div>
                {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" name="email" placeholder="tu@unab.edu.co" value={formData.email}
                    onChange={handleChange} className={cn("pl-9", errors.email && "border-red-400")} required />
                </div>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Tipo de usuario</label>
                  <select name="userType" value={formData.userType} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40" required>
                    <option value="student">Estudiante</option>
                    <option value="tutor">Tutor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Carrera</label>
                  <select name="carrera" value={formData.carrera} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                    <option value="">Selecciona...</option>
                    <option value="Ingeniería de Sistemas">Ing. Sistemas</option>
                    <option value="Ingeniería Industrial">Ing. Industrial</option>
                    <option value="Ingeniería Civil">Ing. Civil</option>
                    <option value="Administración">Administración</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Derecho">Derecho</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  ¿Tienes alguna discapacidad? <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <select name="disabilityType" value={formData.disabilityType} onChange={handleChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  <option value="none">Ninguna</option>
                  <option value="visual">Visual</option>
                  <option value="auditiva">Auditiva</option>
                  <option value="motora">Motora</option>
                  <option value="cognitiva">Cognitiva</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              {formData.disabilityType !== "none" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Describe tu discapacidad</label>
                  <textarea name="disabilityDescription" value={formData.disabilityDescription}
                    onChange={handleChange} rows={2} placeholder="Describe cómo podemos ayudarte..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 resize-none" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" name="password" placeholder="••••••••" value={formData.password}
                      onChange={handleChange} className={cn("pl-9", errors.password && "border-red-400")} required />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirmar</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword}
                      onChange={handleChange} className={cn("pl-9", errors.confirmPassword && "border-red-400")} required />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded mt-0.5 accent-[#00AEEF]" required />
                <span className="text-muted-foreground">
                  Acepto los <a href="#" className="text-[#00AEEF] font-medium">términos de servicio</a> y la{" "}
                  <a href="#" className="text-[#00AEEF] font-medium">política de privacidad</a>
                </span>
              </label>
              <Button type="submit" disabled={isLoading}
                className="w-full text-white font-semibold gap-2 mt-2" style={{ backgroundColor: "#00AEEF" }}>
                {isLoading ? "Registrando..." : <><span>Crear cuenta</span><ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">O</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/" className="text-[#00AEEF] hover:text-[#0090C5] font-semibold">Inicia sesión</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
