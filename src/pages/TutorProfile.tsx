import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Clock, Plus, Save, Loader2, Check, X, User, CheckCircle2, AlertTriangle, Star } from "lucide-react";
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

const TutorProfile = () => {
  const [userData, setUserData]     = useState<UserData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);

  const [tutoringSubjects, setTutoringSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject]             = useState("");
  const [customSubject, setCustomSubject]       = useState("");
  const [tutoringPreferences, setTutoringPreferences] = useState({ morning: false, afternoon: false, evening: false });
  const [ratings, setRatings] = useState<{ average: number; count: number; reviews: any[] }>({ average: 0, count: 0, reviews: [] });

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setError("No hay sesión activa"); setLoading(false); return; }
      const res = await fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(data);
      setTutoringSubjects(data.interest_subjects || []);
      setTutoringPreferences(data.tutoring_preferences || { morning: false, afternoon: false, evening: false });
      fetchRatings(data.id);
    } catch {
      setError("Error al cargar datos del servidor");
    } finally { setLoading(false); }
  };

  const fetchRatings = async (tutorId: number) => {
    try {
      const res = await fetch(`/auth/tutor/${tutorId}/ratings`);
      if (res.ok) setRatings(await res.json());
    } catch {}
  };

  // Lógica original del compañero: guardar materias y preferencias
  const saveTutoringInfo = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interest_subjects: tutoringSubjects, tutoring_preferences: tutoringPreferences }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(prev => prev ? { ...prev, interest_subjects: data.interest_subjects, tutoring_preferences: data.tutoring_preferences } : null);
      setLastSaved(new Date()); setHasChanges(false);
    } catch { setError("Error al guardar información"); }
    finally { setSaving(false); }
  };

  // Lógica original del compañero: agregar materia con opción "custom"
  const handleAddSubject = () => {
    const subjectToAdd = newSubject === "custom" ? customSubject.trim() : newSubject.trim();
    if (subjectToAdd && !tutoringSubjects.includes(subjectToAdd)) {
      setTutoringSubjects([...tutoringSubjects, subjectToAdd]);
      setNewSubject(""); setCustomSubject(""); setHasChanges(true);
    }
  };
  const handleRemoveSubject = (s: string) => { setTutoringSubjects(tutoringSubjects.filter(x => x !== s)); setHasChanges(true); };
  const handleTogglePref    = (p: "morning"|"afternoon"|"evening") => { setTutoringPreferences(prev => ({ ...prev, [p]: !prev[p] })); setHasChanges(true); };

  const name    = userData?.full_name   ?? localStorage.getItem("fullName") ?? "";
  const carrera = userData?.carrera     ?? localStorage.getItem("carrera")  ?? "";
  const initial = name.charAt(0).toUpperCase() || "T";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <div className="h-6 w-6 rounded-full border-2 border-[#8DC63F] border-t-transparent animate-spin" />
      <p className="text-sm">Cargando perfil...</p>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">

      {/* Header */}
      <section className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8DC63F] text-white text-xl font-bold shadow-sm shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{name || "Mi perfil"}</h1>
              <p className="text-sm text-muted-foreground">
                Tutor{carrera ? ` · ${carrera}` : ""}
              </p>
            </div>
          </div>
          {/* Estado de guardado — lógica original del compañero */}
          <div className="flex items-center gap-2 text-xs border border-border/60 bg-card px-3 py-1.5 rounded-full shadow-sm">
            {saving ? (
              <span className="flex items-center gap-1 text-[#0090C5]"><Loader2 size={12} className="animate-spin" /> Sincronizando...</span>
            ) : hasChanges ? (
              <span className="flex items-center gap-1.5 text-[#e08800]"><span className="h-1.5 w-1.5 rounded-full bg-[#FF9900] animate-pulse" /> Cambios pendientes</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-[#578426]"><Check size={12} /> Actualizado</span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground"><Clock size={12} /> Listo</span>
            )}
          </div>
        </div>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-5">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* Columna izquierda */}
        <div className="space-y-5">

          {/* Datos académicos */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap size={16} className="text-[#00AEEF]" /> Datos académicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
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
                  {/* ID docente con estilo especial — igual al compañero */}
                  <Label className="text-xs font-semibold text-[#0090C5] uppercase tracking-wide">ID Docente</Label>
                  <div className="rounded-lg border border-[#00AEEF]/20 bg-[#00AEEF]/5 px-3 py-2">
                    <p className="font-mono font-bold text-[#0090C5] text-sm">{userData?.university_id ?? "—"}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Carrera / Departamento</Label>
                  <Input defaultValue={userData?.carrera ?? ""} className="text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidad preferente */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-[#6B2D8B]" /> Disponibilidad preferente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Indica los horarios en los que prefieres dictar tutorías</p>
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
            </CardContent>
          </Card>

          {/* Botón guardar */}
          {hasChanges && (
            <Button onClick={saveTutoringInfo} disabled={saving}
              className="w-full gap-2 bg-[#8DC63F] hover:bg-[#72a532] text-white font-semibold">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><Save size={15} /> Guardar cambios</>}
            </Button>
          )}
        </div>

        {/* Columna derecha: materias que dicta + valoraciones */}
        <div className="space-y-5">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-4" style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <BookOpen size={16} /> Materias que dictas
              </CardTitle>
              <p className="text-xs text-white/80 mt-1">Gestiona las disciplinas en las que brindas apoyo académico</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Lista de materias */}
              <div className={cn(
                "flex flex-wrap gap-2 p-4 rounded-xl border-2 border-dashed min-h-[100px] content-start transition-colors",
                tutoringSubjects.length > 0 ? "border-[#00AEEF]/20 bg-[#00AEEF]/4" : "border-border/40 bg-muted/10"
              )}>
                {tutoringSubjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay materias registradas</p>
                ) : (
                  tutoringSubjects.map(s => (
                    <Badge key={s} variant="outline"
                      className="gap-1.5 text-xs py-1.5 px-3 bg-white dark:bg-card text-[#0090C5] border-[#00AEEF]/30 hover:border-[#00AEEF]/50 transition-colors">
                      {s}
                      <button onClick={() => handleRemoveSubject(s)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X size={11} />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{tutoringSubjects.length} materias registradas</p>

              {/* Agregar materia — lógica original con opción "custom" */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs font-medium">Agregar materia</Label>
                <div className="flex gap-2">
                  <select
                    value={AVAILABLE_SUBJECTS.includes(newSubject) ? newSubject : newSubject === "custom" ? "custom" : ""}
                    onChange={e => setNewSubject(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                    <option value="">Selecciona del catálogo...</option>
                    {AVAILABLE_SUBJECTS.filter(s => !tutoringSubjects.includes(s)).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="custom">-- Otra --</option>
                  </select>
                  <Button onClick={handleAddSubject} disabled={!newSubject || newSubject === "custom"}
                    className="gap-1.5 text-sm shrink-0 bg-[#00AEEF] hover:bg-[#0090C5] text-white disabled:opacity-40">
                    <Plus size={14} /> Agregar
                  </Button>
                </div>
                {/* Campo de texto para materia personalizada — lógica original */}
                {newSubject === "custom" && (
                  <div className="flex gap-2 animate-fade-in">
                    <Input placeholder="Escribe la materia..." value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)} className="text-sm" autoFocus
                      onKeyDown={e => e.key === "Enter" && handleAddSubject()} />
                    <Button onClick={handleAddSubject} disabled={!customSubject.trim()} variant="secondary" className="shrink-0">Aceptar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Valoraciones */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" /> Valoraciones de estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ratings.count === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aún no tienes valoraciones</p>
              ) : (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="flex items-center gap-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 p-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-amber-600">{ratings.average.toFixed(1)}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={12} className={n <= Math.round(ratings.average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">{ratings.count}</span> valoración{ratings.count !== 1 && "es"}</p>
                    </div>
                  </div>

                  {/* Lista de reseñas */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {ratings.reviews.map((r: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={11} className={n <= r.stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{r.date}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground flex items-center gap-1">
                          <User size={10} className="text-muted-foreground" /> {r.student_name}
                        </p>
                        {r.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{r.comment}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default TutorProfile;
