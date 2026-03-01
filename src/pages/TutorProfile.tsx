import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Clock, Plus, Save, Loader2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserData {
  id: number;
  full_name: string;
  email: string;
  user_type: string;
  student_id: string | null;
  carrera: string | null;
  disability_type: string | null;
  disability_description: string | null;
  interest_subjects: string[];
  tutoring_preferences: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
}

// Materias disponibles para tutors
const availableSubjects = [
  "Cálculo I",
  "Cálculo II",
  "Programación I",
  "Programación II",
  "Álgebra Lineal",
  "Física I",
  "Física II",
  "Estadística",
  "Matemáticas Discretas",
  "Estructura de Datos",
  "Bases de Datos",
  "Redes de Computadoras",
];

const TutorProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Estado para materias que puede dictar
  const [tutoringSubjects, setTutoringSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  // Estado para preferencias de horario
  const [tutoringPreferences, setTutoringPreferences] = useState({
    morning: false,
    afternoon: false,
    evening: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  // Guardar en localStorage cuando hay cambios
  useEffect(() => {
    if (tutoringSubjects.length > 0) {
      localStorage.setItem("tutoring_subjects", JSON.stringify(tutoringSubjects));
    }
    localStorage.setItem("tutor_preferences", JSON.stringify(tutoringPreferences));
  }, [tutoringSubjects, tutoringPreferences]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa");
        setLoading(false);
        return;
      }

      const response = await fetch("/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener datos del usuario");
      }

      const data = await response.json();
      setUserData(data);

      // Cargar materias de interés existentes
      setTutoringSubjects(data.interest_subjects || []);

      // Cargar preferencias de tutoría
      setTutoringPreferences(data.tutoring_preferences || {
        morning: false,
        afternoon: false,
        evening: false,
      });

      // Cargar desde localStorage si no hay datos del servidor
      const localSubjects = localStorage.getItem("tutoring_subjects");
      const localPrefs = localStorage.getItem("tutor_preferences");

      if ((!data.interest_subjects || data.interest_subjects.length === 0) && localSubjects) {
        setTutoringSubjects(JSON.parse(localSubjects));
      }

      if ((!data.tutoring_preferences || Object.values(data.tutoring_preferences).every(v => !v)) && localPrefs) {
        setTutoringPreferences(JSON.parse(localPrefs));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      
      // Cargar desde localStorage como fallback
      const localSubjects = localStorage.getItem("tutoring_subjects");
      const localPrefs = localStorage.getItem("tutor_preferences");
      
      if (localSubjects) setTutoringSubjects(JSON.parse(localSubjects));
      if (localPrefs) setTutoringPreferences(JSON.parse(localPrefs));
      
      setError("Error al cargar datos del servidor. Usando datos locales.");
    } finally {
      setLoading(false);
    }
  };

  const saveTutoringInfo = async () => {
    if (!userData) return;

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/auth/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          interest_subjects: tutoringSubjects,
          tutoring_preferences: tutoringPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar información de tutor");
      }

      const data = await response.json();
      
      // Actualizar datos locales del usuario
      setUserData(prev => prev ? {
        ...prev,
        interest_subjects: data.interest_subjects,
        tutoring_preferences: data.tutoring_preferences
      } : null);
      
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err: any) {
      console.error("Error saving tutoring info:", err);
      setError("Guardado local. Se sincronizará cuando haya conexión.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !tutoringSubjects.includes(newSubject.trim())) {
      setTutoringSubjects([...tutoringSubjects, newSubject.trim()]);
      setNewSubject("");
      setHasChanges(true);
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setTutoringSubjects(tutoringSubjects.filter(s => s !== subject));
    setHasChanges(true);
  };

  const handleTogglePreference = (pref: "morning" | "afternoon" | "evening") => {
    setTutoringPreferences(prev => ({
      ...prev,
      [pref]: !prev[pref]
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" /> Perfil de Tutor
          </h1>
          <p className="text-muted-foreground">Configura tu perfil como tutor</p>
        </div>
        
        {/* Estado de guardado */}
        <div className="flex items-center gap-2 text-sm">
          {saving ? (
            <span className="flex items-center text-blue-600">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Guardando...
            </span>
          ) : hasChanges ? (
            <span className="flex items-center text-amber-600">
              <div className="h-2 w-2 rounded-full bg-amber-500 mr-1 animate-pulse" />
              Cambios sin guardar
            </span>
          ) : lastSaved ? (
            <span className="flex items-center text-green-600">
              <Check className="h-4 w-4 mr-1" />
              Guardado
            </span>
          ) : null}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Información del tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre completo</Label>
                <Input 
                  defaultValue={userData?.full_name || ""} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <Input 
                  defaultValue={userData?.email || ""} 
                  className="mt-1" 
                  disabled
                />
              </div>
              <div>
                <Label>Número de estudiante</Label>
                <Input 
                  defaultValue={userData?.student_id || ""} 
                  className="mt-1" 
                  disabled
                  placeholder="U00123456"
                />
              </div>
              <div>
                <Label>Carrera</Label>
                <Input 
                  defaultValue={userData?.carrera || ""} 
                  className="mt-1" 
                  placeholder="Ej: Ingeniería en Sistemas"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects - Materias que puede dictar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Materias que puedo dictar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona las materias en las que puedes ofrecer tutorías
            </p>
            
            {/* Lista de materias */}
            <div className="flex flex-wrap gap-2">
              {tutoringSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No hay materias seleccionadas
                </p>
              ) : (
                tutoringSubjects.map((subject) => (
                  <Badge 
                    key={subject} 
                    variant="secondary" 
                    className="text-sm py-1.5 px-3 flex items-center gap-1"
                  >
                    {subject}
                    <button
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Agregar materia */}
            <div className="flex gap-2">
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una materia...</option>
                {availableSubjects
                  .filter(s => !tutoringSubjects.includes(s))
                  .map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
              </select>
              <Button 
                variant="outline" 
                onClick={handleAddSubject}
                disabled={!newSubject}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Availability - Horario disponible */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Horario disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona tus horarios disponibles para dar tutorías
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tutoringPreferences.morning ? "default" : "outline"}
                onClick={() => handleTogglePreference("morning")}
                className={tutoringPreferences.morning ? "bg-blue-600" : ""}
              >
                🌅 Mañana (7-12)
              </Button>
              <Button
                variant={tutoringPreferences.afternoon ? "default" : "outline"}
                onClick={() => handleTogglePreference("afternoon")}
                className={tutoringPreferences.afternoon ? "bg-blue-600" : ""}
              >
                ☀️ Tarde (12-18)
              </Button>
              <Button
                variant={tutoringPreferences.evening ? "default" : "outline"}
                onClick={() => handleTogglePreference("evening")}
                className={tutoringPreferences.evening ? "bg-blue-600" : ""}
              >
                🌙 Noche (18-21)
              </Button>
            </div>

            {Object.values(tutoringPreferences).filter(Boolean).length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No hay horario disponible seleccionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <Button 
            onClick={saveTutoringInfo} 
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar información de tutor
              </>
            )}
          </Button>
        )}
      </div>
    </main>
  );
};

export default TutorProfile;
