import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Clock, Plus, Save, Loader2, Check, X, User } from "lucide-react";
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
  university_id: string | null;
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

const availableSubjects = [
  "Cálculo I", "Cálculo II", "Programación I", "Programación II",
  "Álgebra Lineal", "Física I", "Física II", "Estadística",
  "Matemáticas Discretas", "Estructura de Datos", "Bases de Datos", "Redes de Computadoras",
];

const TutorProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [tutoringSubjects, setTutoringSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [tutoringPreferences, setTutoringPreferences] = useState({
    morning: false,
    afternoon: false,
    evening: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa");
        setLoading(false);
        return;
      }

      const response = await fetch("/auth/me", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al obtener datos");

      const data = await response.json();
      setUserData(data);
      setTutoringSubjects(data.interest_subjects || []);
      setTutoringPreferences(data.tutoring_preferences || { morning: false, afternoon: false, evening: false });
    } catch (err) {
      console.error(err);
      setError("Error al cargar datos del servidor");
    } finally {
      setLoading(false);
    }
  };

  const saveTutoringInfo = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
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

      if (!response.ok) throw new Error("Error al guardar");
      const data = await response.json();
      setUserData(prev => prev ? { ...prev, interest_subjects: data.interest_subjects, tutoring_preferences: data.tutoring_preferences } : null);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      setError("Error al guardar información");
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
    setTutoringPreferences(prev => ({ ...prev, [pref]: !prev[pref] }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <div className="flex items-center justify-between mb-8 text-center sm:text-left flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-900 leading-tight">
            <User className="h-8 w-8 text-indigo-600 bg-indigo-50 p-1.5 rounded-lg shadow-sm" />
            Configuración del Perfil de Tutor
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Administra tu información académica y las materias que dominas</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm text-sm font-medium">
          {saving ? (
            <span className="flex items-center text-blue-600">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </span>
          ) : hasChanges ? (
            <span className="flex items-center text-amber-600">
              <div className="h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
              Cambios pendientes
            </span>
          ) : lastSaved ? (
            <span className="flex items-center text-green-600">
              <Check className="h-4 w-4 mr-2" />
              Actualizado
            </span>
          ) : (
            <span className="text-muted-foreground italic flex items-center gap-2">
              <Clock className="h-4 w-4" /> Listo
            </span>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 mb-6">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="shadow-xl bg-white border-2 border-indigo-50/50">
            <CardHeader className="bg-gradient-to-r from-indigo-50/20 to-transparent pb-4">
              <CardTitle className="text-xl flex items-center gap-3 text-indigo-900">
                <GraduationCap className="h-6 w-6 text-indigo-600" /> Datos Académicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre completo</Label>
                    <Input defaultValue={userData?.full_name || ""} className="h-11 border-indigo-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correo electrónico</Label>
                    <Input defaultValue={userData?.email || ""} className="h-11 bg-muted/30 border-muted" disabled />
                  </div>
                  <div className="space-y-2 border-l-4 border-indigo-200 pl-4 bg-indigo-50/20 py-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">ID Docente</Label>
                    <p className="text-lg font-mono font-bold text-indigo-900">{userData?.university_id || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Carrera</Label>
                    <Input defaultValue={userData?.carrera || ""} className="h-11 border-indigo-100" />
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed">
                  <h3 className="font-semibold text-indigo-900 mb-3">Disponibilidad Preferente</h3>
                  <div className="flex flex-wrap gap-3">
                    {["morning", "afternoon", "evening"].map((p) => (
                      <Button
                        key={p}
                        variant={tutoringPreferences[p as keyof typeof tutoringPreferences] ? "default" : "outline"}
                        onClick={() => handleTogglePreference(p as any)}
                        className={tutoringPreferences[p as keyof typeof tutoringPreferences] ? "bg-indigo-600 shadow-md" : "border-indigo-100 text-indigo-600"}
                      >
                        {p === "morning" ? "🌅 Mañana" : p === "afternoon" ? "☀️ Tarde" : "🌙 Noche"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasChanges && (
            <Button onClick={saveTutoringInfo} disabled={saving} className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl gap-3">
              {saving ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
              Guardar Cambios
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-xl bg-white border-2 border-indigo-600/10 min-h-[500px]">
            <CardHeader className="bg-indigo-600 text-white pb-6 pt-8">
              <CardTitle className="text-2xl flex items-center gap-3">
                <BookOpen className="h-8 w-8" /> Materias que Dictas
              </CardTitle>
              <p className="text-indigo-100 mt-2">Gestiona las disciplinas en las que brindas apoyo académico</p>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-3 p-6 bg-indigo-50/30 rounded-2xl border-2 border-dashed border-indigo-100 min-h-[120px] content-start">
                  {tutoringSubjects.map((s) => (
                    <Badge key={s} className="text-sm py-2.5 px-5 bg-white text-indigo-700 border-2 border-indigo-200">
                      {s}
                      <button onClick={() => handleRemoveSubject(s)} className="ml-3 text-muted-foreground hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vincular Nueva Materia</Label>
                <div className="flex gap-2">
                  <select
                    value={availableSubjects.includes(newSubject) ? newSubject : ""}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="flex-1 h-12 px-4 bg-white border-2 border-indigo-50 rounded-xl"
                  >
                    <option value="">Selecciona del catálogo...</option>
                    {availableSubjects.filter(s => !tutoringSubjects.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="custom">-- Otra --</option>
                  </select>
                  <Button onClick={handleAddSubject} disabled={!newSubject || newSubject === "custom"} className="h-12 bg-indigo-600">
                    <Plus className="h-5 w-5 mr-2" /> Agregar
                  </Button>
                </div>
                {newSubject === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Escribe la materia..." onChange={(e) => setNewSubject(e.target.value)} className="h-11" />
                    <Button onClick={handleAddSubject} variant="secondary" className="h-11">Aceptar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default TutorProfile;
