import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, User, BookOpen, ArrowRight, School } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    carrera: "",
    userType: "student",
    disabilityType: "none",
    disabilityDescription: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = "El nombre es requerido";
    if (!formData.email) newErrors.email = "El correo es requerido";
    if (!formData.studentId) newErrors.studentId = "El número de estudiante es requerido";
    if (!formData.password) newErrors.password = "La contraseña es requerida";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          university_id: formData.studentId,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          carrera: formData.carrera || null,
          user_type: formData.userType,
          disability_type: formData.disabilityType !== "none" ? formData.disabilityType : null,
          disability_description: formData.disabilityDescription || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al registrar usuario");
      }

      // Registro exitoso, redirigir al login
      navigate("/");
    } catch (error: any) {
      console.error("Error en registro:", error);
      setErrors({ submit: error.message || "Error al conectar con el servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TutorHub</h1>
          </div>
          <p className="text-gray-600">Únete a nuestra comunidad académica</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription className="text-indigo-100">
              Completa tus datos para registrarte
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error global */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de estudiante
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    name="studentId"
                    placeholder="U00123456"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.studentId && (
                  <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de usuario
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                  required
                >
                  <option value="student">Estudiante</option>
                  <option value="tutor">Tutor</option>
                </select>
              </div>

              {/* Carrera */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Carrera (opcional)
                </label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Selecciona tu carrera</option>
                  <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                  <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                  <option value="Ingeniería Civil">Ingeniería Civil</option>
                  <option value="Administración">Administración</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Derecho">Derecho</option>
                  <option value="Medicina">Medicina</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              {/* Disability */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Tienes alguna discapacidad? (opcional)
                </label>
                <select
                  name="disabilityType"
                  value={formData.disabilityType}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                >
                  <option value="none">Ninguna</option>
                  <option value="visual">Visual</option>
                  <option value="auditiva">Auditiva</option>
                  <option value="motora">Motora</option>
                  <option value="cognitiva">Cognitiva</option>
                  <option value="otra">Otra</option>
                </select>
              </div>

              {/* Disability Description */}
              {formData.disabilityType !== "none" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Describe tu discapacidad
                  </label>
                  <textarea
                    name="disabilityDescription"
                    value={formData.disabilityDescription}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Describe cómo podemos ayudarte..."
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4 rounded mt-0.5" required />
                <span className="text-gray-700">
                  Acepto los{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    términos de servicio
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    política de privacidad
                  </a>
                </span>
              </label>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 font-semibold mt-6 flex items-center justify-center gap-2"
              >
                {isLoading ? "Registrando..." : (
                  <>
                    Crear cuenta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O</span>
              </div>
            </div>

            {/* Login Link */}
            <p className="text-center text-gray-700">
              ¿Ya tienes cuenta?{" "}
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
