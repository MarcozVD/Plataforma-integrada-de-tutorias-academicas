import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, User, ArrowRight, School, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const STUDENT_DISABILITY_OPTIONS = [
  { value: "ninguna", label: "Ninguna" },
  { value: "visual",  label: "Visual" },
  { value: "auditiva", label: "Auditiva" },
  { value: "motriz",  label: "Motriz" },
  { value: "cognitiva", label: "Cognitiva" },
];

const TUTOR_SUPPORT_OPTIONS = [
  { value: "ninguna",  label: "Ninguna en particular" },
  { value: "visual",   label: "Visual" },
  { value: "auditiva", label: "Auditiva" },
  { value: "motriz",   label: "Motriz" },
  { value: "cognitiva", label: "Cognitiva" },
  { value: "todas",    label: "Todas" },
];

function validateForm(formData: typeof INITIAL_STATE) {
  const errs: Record<string, string> = {};

  const name = formData.fullName.trim();
  if (!name) {
    errs.fullName = "El nombre es requerido";
  } else if (name.length < 3) {
    errs.fullName = "El nombre debe tener al menos 3 caracteres";
  } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(name)) {
    errs.fullName = "El nombre solo puede contener letras y espacios";
  }

  if (!formData.email) errs.email = "El correo es requerido";

  const id = formData.studentId.trim();
  if (!id) {
    errs.studentId = "El número de identificación es requerido";
  } else if (!/^\d{5,15}$/.test(id)) {
    errs.studentId = "Debe tener entre 5 y 15 dígitos numéricos";
  }

  if (!formData.carrera) errs.carrera = "La carrera es requerida";

  if (!formData.password) {
    errs.password = "La contraseña es requerida";
  } else if (formData.password.length < 8) {
    errs.password = "Mínimo 8 caracteres";
  } else if (!/[A-Z]/.test(formData.password)) {
    errs.password = "Debe contener al menos una letra mayúscula";
  } else if (!/[0-9]/.test(formData.password)) {
    errs.password = "Debe contener al menos un número";
  }

  if (formData.password !== formData.confirmPassword)
    errs.confirmPassword = "Las contraseñas no coinciden";

  return errs;
}

const INITIAL_STATE = {
  fullName: "", email: "", studentId: "", password: "", confirmPassword: "",
  carrera: "", userType: "student" as "student" | "tutor",
  disabilityType: "ninguna", disabilityDescription: "",
  disabilitySupportType: "ninguna", disabilitySupportDescription: "",
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading]   = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (type: "student" | "tutor") => {
    setFormData(prev => ({
      ...prev,
      userType: type,
      disabilityType: "ninguna",
      disabilitySupportType: "ninguna",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true); setErrors({});
    try {
      const endpoint =
        formData.userType === "student"
          ? "/auth/register/student"
          : "/auth/register/tutor";

      const body =
        formData.userType === "student"
          ? {
              full_name:            formData.fullName.trim(),
              email:                formData.email,
              university_id:        formData.studentId.trim(),
              password:             formData.password,
              confirm_password:     formData.confirmPassword,
              carrera:              formData.carrera,
              user_type:            "student",
              disability_type:      formData.disabilityType,
              disability_description: formData.disabilityDescription || null,
            }
          : {
              full_name:                    formData.fullName.trim(),
              email:                        formData.email,
              university_id:                formData.studentId.trim(),
              password:                     formData.password,
              confirm_password:             formData.confirmPassword,
              carrera:                      formData.carrera,
              user_type:                    "tutor",
              disability_support_type:      formData.disabilitySupportType,
              disability_support_description: formData.disabilitySupportDescription || null,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg =
          Array.isArray(data.detail)
            ? data.detail.map((d: any) => d.msg).join(" · ")
            : data.detail ?? "Error al registrar usuario";
        throw new Error(msg);
      }
      navigate("/");
    } catch (error: any) {
      setErrors({ submit: error.message || "Error al conectar con el servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = formData.userType === "student";

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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Tipo de usuario */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Soy...</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["student", "tutor"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleUserTypeChange(type)}
                      className={cn(
                        "py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                        formData.userType === type
                          ? "bg-[#00AEEF] border-[#00AEEF] text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:border-[#00AEEF]/50"
                      )}
                    >
                      {type === "student" ? "Estudiante" : "Tutor"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" name="fullName" placeholder="Juan Pérez" value={formData.fullName}
                    onChange={handleChange} className={cn("pl-9", errors.fullName && "border-red-400")} />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
              </div>

              {/* ID */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Número de identificación académica</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" name="studentId" placeholder="Ej: 20200001" value={formData.studentId}
                    onChange={handleChange} className={cn("pl-9", errors.studentId && "border-red-400")} />
                </div>
                {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
              </div>

              {/* Correo */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" name="email" placeholder="tu@unab.edu.co" value={formData.email}
                    onChange={handleChange} className={cn("pl-9", errors.email && "border-red-400")} />
                </div>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Carrera */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Carrera</label>
                <select name="carrera" value={formData.carrera} onChange={handleChange}
                  className={cn("w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40",
                    errors.carrera ? "border-red-400" : "border-input")}>
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
                {errors.carrera && <p className="text-red-500 text-xs">{errors.carrera}</p>}
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" name="password" placeholder="••••••••" value={formData.password}
                      onChange={handleChange} className={cn("pl-9", errors.password && "border-red-400")} />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirmar</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword}
                      onChange={handleChange} className={cn("pl-9", errors.confirmPassword && "border-red-400")} />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Mínimo 8 caracteres, una mayúscula y un número
              </p>

              {/* Discapacidad — diferente según tipo de usuario */}
              {isStudent ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    ¿Tienes alguna discapacidad?
                  </label>
                  <select name="disabilityType" value={formData.disabilityType} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                    {STUDENT_DISABILITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {formData.disabilityType !== "ninguna" && (
                    <div className="space-y-1.5 mt-2">
                      <label className="text-sm font-medium text-foreground">Describe tu discapacidad</label>
                      <textarea name="disabilityDescription" value={formData.disabilityDescription}
                        onChange={handleChange} rows={2} placeholder="Describe cómo podemos ayudarte..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 resize-none" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    ¿Qué discapacidad puedes atender?
                  </label>
                  <select name="disabilitySupportType" value={formData.disabilitySupportType} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                    {TUTOR_SUPPORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {formData.disabilitySupportType !== "ninguna" && (
                    <div className="space-y-1.5 mt-2">
                      <label className="text-sm font-medium text-foreground">Describe cómo apoyas esta necesidad</label>
                      <textarea name="disabilitySupportDescription" value={formData.disabilitySupportDescription}
                        onChange={handleChange} rows={2} placeholder="Ej: Manejo lenguaje de señas, tengo experiencia con..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 resize-none" />
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded mt-0.5 accent-[#00AEEF]" required />
                <span className="text-muted-foreground">
                  Acepto los{" "}
                  <a href="#" className="text-[#00AEEF] font-medium">términos de servicio</a>{" "}
                  y la{" "}
                  <a href="#" className="text-[#00AEEF] font-medium">política de privacidad</a>
                </span>
              </label>

              <Button type="submit" disabled={isLoading}
                className="w-full text-white font-semibold gap-2 mt-2" style={{ backgroundColor: "#00AEEF" }}>
                {isLoading ? "Registrando..." : <><span>Crear cuenta</span><ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
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
