import { useState, useEffect, useCallback } from "react";
import { User, BookOpen, Clock, GraduationCap, Accessibility, X, Plus, Save, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// Materias disponibles para seleccionar
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

const disabilityLabels: Record<string, string> = {
  none: "Ninguna",
  visual: "Visual",
  auditiva: "Auditiva",
  motora: "Motora",
  cognitiva: "Cognitiva",
  otra: "Otra",
};

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const StudentProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Estado para materias de interés
  const [interestSubjects, setInterestSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  
  // Estado para preferencias de tutoría
  const [tutoringPreferences, setTutoringPreferences] = useState({
    morning: false,
    afternoon: false,
    evening: false,
  });

  // Estado para discapacidad
  const [disabilityType, setDisabilityType] = useState<string>("none");
  const [disabilityDescription, setDisabilityDescription] = useState<string>("");

  // Debounce para detectar cambios
  const debouncedSubjects = useDebounce(interestSubjects, 500);
  const debouncedPreferences = useDebounce(tutoringPreferences, 500);
  const debouncedDisability = useDebounce({ type: disabilityType, description: disabilityDescription }, 500);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Cargar datos guardados localmente al inicio (fallback offline)
  useEffect(() => {
    const localSubjects = localStorage.getItem("interest_subjects");
    const localPreferences = localStorage.getItem("tutoring_preferences");
    const localDisability = localStorage.getItem("disability_info");
    
    if (localSubjects && interestSubjects.length === 0) {
      try {
        setInterestSubjects(JSON.parse(localSubjects));
      } catch (e) {
        console.error("Error parsing local subjects:", e);
      }
    }
    
    if (localPreferences && !tutoringPreferences.morning && !tutoringPreferences.afternoon && !tutoringPreferences.evening) {
      try {
        setTutoringPreferences(JSON.parse(localPreferences));
      } catch (e) {
        console.error("Error parsing local preferences:", e);
      }
    }

    if (localDisability && disabilityType === "none") {
      try {
        const disabilityInfo = JSON.parse(localDisability);
        setDisabilityType(disabilityInfo.type || "none");
        setDisabilityDescription(disabilityInfo.description || "");
      } catch (e) {
        console.error("Error parsing local disability:", e);
      }
    }
  }, []);

  // Guardar en localStorage cuando hay cambios (fallback offline)
  useEffect(() => {
    if (interestSubjects.length > 0) {
      localStorage.setItem("interest_subjects", JSON.stringify(interestSubjects));
    }
    localStorage.setItem("tutoring_preferences", JSON.stringify(tutoringPreferences));
    localStorage.setItem("disability_info", JSON.stringify({ type: disabilityType, description: disabilityDescription }));
  }, [interestSubjects, tutoringPreferences, disabilityType, disabilityDescription]);

  // Auto-guardar cuando hay cambios (después del debounce)
  useEffect(() => {
    if (!userData || !hasChanges) return;

    // Verificar si los datos realmente cambiaron respecto a los del servidor
    const subjectsChanged = JSON.stringify(debouncedSubjects) !== JSON.stringify(userData.interest_subjects);
    const preferencesChanged = JSON.stringify(debouncedPreferences) !== JSON.stringify(userData.tutoring_preferences);
    const disabilityChanged = debouncedDisability.type !== (userData.disability_type || "none") || 
                             debouncedDisability.description !== (userData.disability_description || "");

    if (subjectsChanged || preferencesChanged) {
      savePreferences();
    }
    
    if (disabilityChanged) {
      saveDisability();
    }
  }, [debouncedSubjects, debouncedPreferences, debouncedDisability]);

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
      
      // Inicializar materias de interés
      setInterestSubjects(data.interest_subjects || []);
      
      // Inicializar preferencias de tutoría
      setTutoringPreferences(data.tutoring_preferences || {
        morning: false,
        afternoon: false,
        evening: false,
      });

      // Inicializar discapacidad
      setDisabilityType(data.disability_type || "none");
      setDisabilityDescription(data.disability_description || "");

      // Guardar en localStorage como backup
      if (data.interest_subjects) {
        localStorage.setItem("interest_subjects", JSON.stringify(data.interest_subjects));
      }
      localStorage.setItem("tutoring_preferences", JSON.stringify(data.tutoring_preferences || {}));
      localStorage.setItem("disability_info", JSON.stringify({ 
        type: data.disability_type || "none", 
        description: data.disability_description || "" 
      }));
    } catch (err) {
      console.error("Error fetching user data:", err);
      // Cargar desde localStorage si hay error
      const localSubjects = localStorage.getItem("interest_subjects");
      const localPreferences = localStorage.getItem("tutoring_preferences");
      const localDisability = localStorage.getItem("disability_info");
      
      if (localSubjects) setInterestSubjects(JSON.parse(localSubjects));
      if (localPreferences) setTutoringPreferences(JSON.parse(localPreferences));
      if (localDisability) {
        const di = JSON.parse(localDisability);
        setDisabilityType(di.type || "none");
        setDisabilityDescription(di.description || "");
      }
      
      setError("Error al cargar datos del servidor. Usando datos locales.");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = useCallback(async () => {
    // No guardar si no hay cambios reales
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
          interest_subjects: interestSubjects,
          tutoring_preferences: tutoringPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar preferencias");
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
      console.error("Error saving preferences:", err);
      setError("Guardado local. Se sincronizará cuando haya conexión.");
    } finally {
      setSaving(false);
    }
  }, [interestSubjects, tutoringPreferences, userData]);

  const saveDisability = useCallback(async () => {
    if (!userData) return;

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/auth/disability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          disability_type: disabilityType !== "none" ? disabilityType : null,
          disability_description: disabilityDescription || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar discapacidad");
      }

      const data = await response.json();
      
      // Actualizar datos locales del usuario
      setUserData(prev => prev ? {
        ...prev,
        disability_type: data.disability_type,
        disability_description: data.disability_description
      } : null);
      
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err: any) {
      console.error("Error saving disability:", err);
      setError("Guardado local. Se sincronizará cuando haya conexión.");
    } finally {
      setSaving(false);
    }
  }, [disabilityType, disabilityDescription, userData]);

  const handleAddSubject = () => {
    if (newSubject.trim() && !interestSubjects.includes(newSubject.trim())) {
      setInterestSubjects([...interestSubjects, newSubject.trim()]);
      setNewSubject("");
      setHasChanges(true);
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setInterestSubjects(interestSubjects.filter(s => s !== subject));
    setHasChanges(true);
  };

  const handleTogglePreference = (pref: "morning" | "afternoon" | "evening") => {
    setTutoringPreferences(prev => ({
      ...prev,
      [pref]: !prev[pref]
    }));
    setHasChanges(true);
  };

  const handleDisabilityChange = (newType: string) => {
    setDisabilityType(newType);
    setHasChanges(true);
  };

  const handleDisabilityDescriptionChange = (desc: string) => {
    setDisabilityDescription(desc);
    setHasChanges(true);
  };

  const handleSaveNow = () => {
    setHasChanges(true);
    savePreferences();
    saveDisability();
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
            <User className="h-6 w-6" /> Mi Perfil
          </h1>
          <p className="text-muted-foreground">Configura tu perfil y preferencias</p>
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
              <GraduationCap className="h-5 w-5" /> Información académica
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
                <Label>Carrera</Label>
                <Input 
                  defaultValue={userData?.carrera || ""} 
                  className="mt-1" 
                  placeholder="Ej: Ingeniería en Sistemas"
                />
              </div>
              <div>
                <Label>Código estudiantil</Label>
                <Input 
                  defaultValue={userData?.student_id || ""} 
                  className="mt-1" 
                  placeholder="Ej: U00123456"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disability Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Accessibility className="h-5 w-5" /> Información de accesibilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de discapacidad</Label>
              <select
                value={disabilityType}
                onChange={(e) => handleDisabilityChange(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Ninguna</option>
                <option value="visual">Visual</option>
                <option value="auditiva">Auditiva</option>
                <option value="motora">Motora</option>
                <option value="cognitiva">Cognitiva</option>
                <option value="otra">Otra</option>
              </select>
            </div>
            
            {disabilityType !== "none" && (
              <div>
                <Label>Descripción de necesidades específicas</Label>
                <textarea
                  value={disabilityDescription}
                  onChange={(e) => handleDisabilityDescriptionChange(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe qué adaptaciones necesitas para tus tutorías..."
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Esta información se guarda en una tabla separada y es confidencial.
            </p>
          </CardContent>
        </Card>

        {/* Interest Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Materias de interés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona las materias en las que necesitas tutorías
            </p>
            
            {/* Lista de materias seleccionadas */}
            <div className="flex flex-wrap gap-2">
              {interestSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No hay materias seleccionadas
                </p>
              ) : (
                interestSubjects.map((subject) => (
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
                  .filter(s => !interestSubjects.includes(s))
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

        {/* Tutoring Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Preferencias de tutoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona tus horarios preferidos para recibir tutorías
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
                No hay horario preferido seleccionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button (optional - for manual save) */}
        {hasChanges && (
          <Button 
            onClick={handleSaveNow} 
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
                Guardar ahora
              </>
            )}
          </Button>
        )}
      </div>
    </main>
  );
};

export default StudentProfile;
