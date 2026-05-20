import { useState, useEffect, useCallback } from "react";
import { User, BookOpen, Clock, GraduationCap, Accessibility, X, Plus, Save, Loader2, Check, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  tutoring_preferences: { morning?: boolean; afternoon?: boolean; evening?: boolean; };
}

const AVAILABLE_SUBJECTS = [
  "Cálculo I", "Cálculo II", "Programación I", "Programación II",
  "Álgebra Lineal", "Física I", "Física II", "Estadística",
  "Matemáticas Discretas", "Estructura de Datos", "Bases de Datos", "Redes de Computadoras",
];

const SCHEDULE_OPTIONS = [
  { key: "morning"   as const, label: "Mañana",  range: "7:00 – 12:00",  icon: "🌅" },
  { key: "afternoon" as const, label: "Tarde",   range: "12:00 – 18:00", icon: "☀️" },
  { key: "evening"   as const, label: "Noche",   range: "18:00 – 21:00", icon: "🌙" },
];

// Hook debounce — lógica original del compañero
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

const StudentProfile = () => {
  const [userData, setUserData]     = useState<UserData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);

  const [interestSubjects, setInterestSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject]             = useState("");
  const [tutoringPreferences, setTutoringPreferences] = useState({ morning: false, afternoon: false, evening: false });
  const [disabilityType, setDisabilityType]               = useState("none");
  const [disabilityDescription, setDisabilityDescription] = useState("");

  // Debounce — lógica original del compañero
  const debouncedSubjects    = useDebounce(interestSubjects, 500);
  const debouncedPreferences = useDebounce(tutoringPreferences, 500);
  const debouncedDisability  = useDebounce({ type: disabilityType, description: disabilityDescription }, 500);

  useEffect(() => { fetchUserData(); }, []);

  // Fallback offline — lógica original del compañero
  useEffect(() => {
    const ls = localStorage.getItem("interest_subjects");
    const lp = localStorage.getItem("tutoring_preferences");
    const ld = localStorage.getItem("disability_info");
    if (ls && interestSubjects.length === 0) { try { setInterestSubjects(JSON.parse(ls)); } catch {} }
    if (lp && !tutoringPreferences.morning && !tutoringPreferences.afternoon && !tutoringPreferences.evening) {
      try { setTutoringPreferences(JSON.parse(lp)); } catch {}
    }
    if (ld && disabilityType === "none") {
      try { const d = JSON.parse(ld); setDisabilityType(d.type || "none"); setDisabilityDescription(d.description || ""); } catch {}
    }
  }, []);

  // Persistir en localStorage — lógica original del compañero
  useEffect(() => {
    if (interestSubjects.length > 0) localStorage.setItem("interest_subjects", JSON.stringify(interestSubjects));
    localStorage.setItem("tutoring_preferences", JSON.stringify(tutoringPreferences));
    localStorage.setItem("disability_info", JSON.stringify({ type: disabilityType, description: disabilityDescription }));
  }, [interestSubjects, tutoringPreferences, disabilityType, disabilityDescription]);

  // Auto-guardar con debounce — lógica original del compañero
  useEffect(() => {
    if (!userData || !hasChanges) return;
    const subjectsChanged    = JSON.stringify(debouncedSubjects) !== JSON.stringify(userData.interest_subjects);
    const preferencesChanged = JSON.stringify(debouncedPreferences) !== JSON.stringify(userData.tutoring_preferences);
    const disabilityChanged  = debouncedDisability.type !== (userData.disability_type || "none") ||
      debouncedDisability.description !== (userData.disability_description || "");
    if (subjectsChanged || preferencesChanged) savePreferences();
    if (disabilityChanged) saveDisability();
  }, [debouncedSubjects, debouncedPreferences, debouncedDisability]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setError("No hay sesión activa"); setLoading(false); return; }
      const res = await fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(data);
      setInterestSubjects(data.interest_subjects || []);
      setTutoringPreferences(data.tutoring_preferences || { morning: false, afternoon: false, evening: false });
      setDisabilityType(data.disability_type || "none");
      setDisabilityDescription(data.disability_description || "");
      if (data.interest_subjects) localStorage.setItem("interest_subjects", JSON.stringify(data.interest_subjects));
      localStorage.setItem("tutoring_preferences", JSON.stringify(data.tutoring_preferences || {}));
      localStorage.setItem("disability_info", JSON.stringify({ type: data.disability_type || "none", description: data.disability_description || "" }));
    } catch {
      const ls = localStorage.getItem("interest_subjects");
      const lp = localStorage.getItem("tutoring_preferences");
      const ld = localStorage.getItem("disability_info");
      if (ls) setInterestSubjects(JSON.parse(ls));
      if (lp) setTutoringPreferences(JSON.parse(lp));
      if (ld) { const d = JSON.parse(ld); setDisabilityType(d.type || "none"); setDisabilityDescription(d.description || ""); }
      setError("Error al cargar datos del servidor. Usando datos locales.");
    } finally { setLoading(false); }
  };

  const savePreferences = useCallback(async () => {
    if (!userData) return;
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay sesión activa");
      const res = await fetch("/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interest_subjects: interestSubjects, tutoring_preferences: tutoringPreferences }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(prev => prev ? { ...prev, interest_subjects: data.interest_subjects, tutoring_preferences: data.tutoring_preferences } : null);
      setLastSaved(new Date()); setHasChanges(false);
    } catch { setError("Guardado local. Se sincronizará cuando haya conexión."); }
    finally { setSaving(false); }
  }, [interestSubjects, tutoringPreferences, userData]);

  const saveDisability = useCallback(async () => {
    if (!userData) return;
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay sesión activa");
      const res = await fetch("/auth/disability", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disability_type: disabilityType !== "none" ? disabilityType : null, disability_description: disabilityDescription || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(prev => prev ? { ...prev, disability_type: data.disability_type, disability_description: data.disability_description } : null);
      setLastSaved(new Date()); setHasChanges(false);
    } catch { setError("Guardado local. Se sincronizará cuando haya conexión."); }
    finally { setSaving(false); }
  }, [disabilityType, disabilityDescription, userData]);

  const handleAddSubject    = () => {
    if (newSubject.trim() && !interestSubjects.includes(newSubject.trim())) {
      setInterestSubjects([...interestSubjects, newSubject.trim()]);
      setNewSubject(""); setHasChanges(true);
    }
  };
  const handleRemoveSubject = (s: string) => { setInterestSubjects(interestSubjects.filter(x => x !== s)); setHasChanges(true); };
  const handleTogglePref    = (p: "morning"|"afternoon"|"evening") => { setTutoringPreferences(prev => ({ ...prev, [p]: !prev[p] })); setHasChanges(true); };
  const handleSaveNow       = () => { setHasChanges(true); savePreferences(); saveDisability(); };

  // Nombre e inicial del usuario
  const name    = userData?.full_name ?? localStorage.getItem("fullName") ?? "";
  const carrera = userData?.carrera   ?? localStorage.getItem("carrera")  ?? "";
  const initial = name.charAt(0).toUpperCase() || "E";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <div className="h-6 w-6 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin" />
      <p className="text-sm">Cargando perfil...</p>
    </div>
  );

  return (
    <main className="container mx-auto px-6 py-8 max-w-7xl animate-fade-in">

      {/* Header */}
      <section className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00AEEF] text-white text-xl font-bold shadow-sm shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{name || "Mi perfil"}</h1>
              <p className="text-sm text-muted-foreground">{carrera || "Estudiante UNAB"}</p>
            </div>
          </div>
          {/* Estado de guardado */}
          <div className="flex items-center gap-2 text-xs">
            {saving ? (
              <span className="flex items-center gap-1 text-[#0090C5]"><Loader2 size={12} className="animate-spin" /> Guardando...</span>
            ) : hasChanges ? (
              <span className="flex items-center gap-1.5 text-[#e08800]"><span className="h-1.5 w-1.5 rounded-full bg-[#FF9900] animate-pulse" /> Cambios sin guardar</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-[#578426]"><CheckCircle2 size={12} /> Guardado</span>
            ) : null}
          </div>
        </div>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#e08800] bg-[#FF9900]/8 border border-[#FF9900]/25 px-4 py-3 rounded-lg mb-5">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">

        {/* Columna izquierda: datos + accesibilidad */}
        <div className="space-y-5">
          {/* Información académica */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap size={16} className="text-[#00AEEF]" /> Información académica
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nombre completo</Label>
                  <Input defaultValue={userData?.full_name ?? ""} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Correo electrónico</Label>
                  <Input defaultValue={userData?.email ?? ""} disabled className="text-sm bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Carrera</Label>
                  <Input defaultValue={userData?.carrera ?? ""} placeholder="Ej: Ingeniería en Sistemas" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ID académico</Label>
                  <Input defaultValue={userData?.university_id ?? ""} disabled className="text-sm bg-muted/30 font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accesibilidad */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <Accessibility size={16} className="text-[#FF9900]" /> Información de accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo de discapacidad</Label>
                <select value={disabilityType} onChange={e => { setDisabilityType(e.target.value); setHasChanges(true); }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  <option value="none">Ninguna</option>
                  <option value="visual">Visual</option>
                  <option value="auditiva">Auditiva</option>
                  <option value="motora">Motora</option>
                  <option value="cognitiva">Cognitiva</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              {disabilityType !== "none" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Descripción de necesidades específicas</Label>
                  <textarea value={disabilityDescription} onChange={e => { setDisabilityDescription(e.target.value); setHasChanges(true); }}
                    rows={3} placeholder="Describe qué adaptaciones necesitas para tus tutorías..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 resize-none" />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">Esta información es confidencial y se usa para asignarte aulas y tutores adecuados.</p>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: materias + preferencias */}
        <div className="space-y-5">
          {/* Materias de interés */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={16} className="text-[#8DC63F]" /> Materias de interés
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-muted-foreground">Selecciona las materias en las que necesitas tutorías.</p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {interestSubjects.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No hay materias seleccionadas</span>
                ) : (
                  interestSubjects.map(s => (
                    <Badge key={s} variant="outline"
                      className="gap-1 text-xs py-1 px-2.5 bg-[#8DC63F]/10 border-[#8DC63F]/30 text-[#578426]">
                      {s}
                      <button onClick={() => handleRemoveSubject(s)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  <option value="">Selecciona una materia...</option>
                  {AVAILABLE_SUBJECTS.filter(s => !interestSubjects.includes(s)).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={handleAddSubject} disabled={!newSubject}
                  className="gap-1.5 text-sm shrink-0 border-[#8DC63F]/40 text-[#578426] hover:bg-[#8DC63F]/10 disabled:opacity-40">
                  <Plus size={14} /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferencias de horario */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-[#6B2D8B]" /> Preferencias de tutoría
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-muted-foreground">Indica los horarios en los que prefieres recibir tutorías</p>
              <div className="grid grid-cols-3 gap-3">
                {SCHEDULE_OPTIONS.map(({ key, label, range, icon }) => {
                  const active = tutoringPreferences[key];
                  return (
                    <button key={key} onClick={() => handleTogglePref(key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-all",
                        active
                          ? "border-[#6B2D8B]/40 bg-[#6B2D8B]/10 text-[#6B2D8B]"
                          : "border-border/60 bg-card text-muted-foreground hover:border-[#6B2D8B]/20 hover:bg-[#6B2D8B]/5"
                      )}>
                      <span className="text-2xl">{icon}</span>
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-[10px] opacity-70">{range}</span>
                      {active && <span className="flex items-center gap-0.5 text-[10px] font-medium"><CheckCircle2 size={10} /> Seleccionado</span>}
                    </button>
                  );
                })}
              </div>
              {!Object.values(tutoringPreferences).some(Boolean) && (
                <p className="text-xs text-muted-foreground italic">No hay horario preferido seleccionado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botón guardar — ancho completo fuera del grid */}
      {hasChanges && (
        <Button onClick={handleSaveNow} disabled={saving}
          className="w-full mt-5 gap-2 bg-[#00AEEF] hover:bg-[#0090C5] text-white font-semibold">
          {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><Save size={15} /> Guardar ahora</>}
        </Button>
      )}
    </main>
  );
};

export default StudentProfile;