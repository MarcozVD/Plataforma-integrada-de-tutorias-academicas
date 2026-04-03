import { useState, useEffect, useMemo } from "react";
import { Clock, Search, Filter, X, CalendarDays, Plus, Trash2, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TutoringCard from "@/components/TutoringCard";
import { cn } from "@/lib/utils";

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  isTutoring?: boolean;
  isPast?: boolean;
  session_id?: number;
}

const ALL_DAYS    = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_INDEX   = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS_RANGE = Array.from({ length: 15 }, (_, i) => `${6 + i}:00`);
const timeToMin   = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

const Schedule = () => {
  const [userSchedule, setUserSchedule]         = useState<ScheduleBlock[]>([]);
  const [enrolledSessions, setEnrolledSessions] = useState<any[]>([]);
  const [realAllSessions, setRealAllSessions]   = useState<any[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [overlapResult, setOverlapResult]       = useState<null|number>(null);
  const [blockError, setBlockError]             = useState("");

  const [newBlock, setNewBlock] = useState({ day: "Lunes", subject: "", startTime: "08:00", endTime: "09:00" });
  const [searchTutoring, setSearchTutoring] = useState("");
  const [subjectFilter, setSubjectFilter]   = useState("all");
  const [dateFilter, setDateFilter]         = useState("");
  const [filtersOpen, setFiltersOpen]       = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("userHorario");
    if (saved) { try { setUserSchedule(JSON.parse(saved)); } catch {} }
    fetchEnrolledSessions();
    fetchAllSessions();
  }, []);

  useEffect(() => { localStorage.setItem("userHorario", JSON.stringify(userSchedule)); }, [userSchedule]);

  const fetchEnrolledSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/student/enrolled-sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEnrolledSessions(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchAllSessions = async () => {
    try {
      const res = await fetch("/auth/sessions");
      if (res.ok) setRealAllSessions(await res.json());
    } catch {}
  };

  const combinedSchedule = useMemo(() => {
    const blocks: ScheduleBlock[] = enrolledSessions.map(s => {
      const dt    = new Date(s.date_time);
      const day   = DAY_INDEX[dt.getDay()];
      const h     = dt.getHours().toString().padStart(2, "0");
      const m     = dt.getMinutes().toString().padStart(2, "0");
      const endDt = new Date(dt.getTime() + s.duration * 60000);
      return {
        id: `enroll-${s.id}`, session_id: s.id, day,
        subject: `[TUT] ${s.subject}`,
        startTime: `${h}:${m}`,
        endTime: `${endDt.getHours().toString().padStart(2,"0")}:${endDt.getMinutes().toString().padStart(2,"0")}`,
        isTutoring: true, isPast: dt < new Date(),
      };
    });
    return [...userSchedule, ...blocks];
  }, [userSchedule, enrolledSessions]);

  const availableSubjects = useMemo(() => [...new Set(realAllSessions.map(t => t.subject))], [realAllSessions]);

  const filteredEnrolled = useMemo(() => enrolledSessions.filter(t => {
    const matchSearch  = t.subject.toLowerCase().includes(searchTutoring.toLowerCase()) || t.tutor_name.toLowerCase().includes(searchTutoring.toLowerCase());
    const matchSubject = subjectFilter === "all" || t.subject === subjectFilter;
    const matchDate    = !dateFilter || t.date_time.startsWith(dateFilter);
    return matchSearch && matchSubject && matchDate;
  }), [searchTutoring, subjectFilter, dateFilter, enrolledSessions]);

  const activeFiltersCount = [searchTutoring !== "", subjectFilter !== "all", dateFilter !== ""].filter(Boolean).length;
  const clearFilters = () => { setSearchTutoring(""); setSubjectFilter("all"); setDateFilter(""); };

  const handleAddBlock = () => {
    setBlockError("");
    if (!newBlock.subject.trim()) { setBlockError("Por favor ingresa el nombre de la materia."); return; }
    if (newBlock.startTime >= newBlock.endTime) { setBlockError("La hora de fin debe ser después del inicio."); return; }
    const newStart = timeToMin(newBlock.startTime), newEnd = timeToMin(newBlock.endTime);
    const conflict = combinedSchedule.some(b => {
      if (b.day !== newBlock.day) return false;
      const bs = timeToMin(b.startTime), be = timeToMin(b.endTime);
      return !(newEnd <= bs || newStart >= be);
    });
    if (conflict) { setBlockError(`Ya tienes un bloque en ${newBlock.day} que se solapa con este horario.`); return; }
    setUserSchedule([...userSchedule, { id: Date.now().toString(), ...newBlock }]);
    setNewBlock({ day: "Lunes", subject: "", startTime: "08:00", endTime: "09:00" });
  };

  // Lógica original del compañero: cancelar desde el calendario con session_id
  const handleRemoveBlock = async (id: string, sessionId?: number) => {
    if (id.startsWith("enroll-") && sessionId) {
      if (!confirm("¿Cancelar esta tutoría? El cupo quedará disponible para otro estudiante.")) return;
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch(`/auth/sessions/${sessionId}/enroll`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { fetchEnrolledSessions(); fetchAllSessions(); }
        else alert("No se pudo cancelar la tutoría.");
      } catch { alert("Error de conexión"); }
      return;
    }
    setUserSchedule(userSchedule.filter(b => b.id !== id));
  };

  const checkSolapamientos = () => {
    const solapados: string[] = [];
    realAllSessions.forEach(tutoria => {
      const dt    = new Date(tutoria.date_time);
      const tDay  = DAY_INDEX[dt.getDay()];
      const tS    = dt.getHours() * 60 + dt.getMinutes();
      const tE    = tS + tutoria.duration;
      const found = userSchedule.some(b => {
        if (b.day !== tDay) return false;
        const bs = timeToMin(b.startTime), be = timeToMin(b.endTime);
        return !(tE <= bs || tS >= be);
      });
      if (found) solapados.push(tutoria.id);
    });
    setOverlapResult(solapados.length);
    setTimeout(() => setOverlapResult(null), 5000);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mi horario académico</h1>
        <p className="text-muted-foreground mt-1">Carga tus clases y verifica qué tutorías no se solapan</p>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Formulario */}
      <Card className="mb-6 border border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={16} className="text-[#00AEEF]" /> Agregar clase o actividad
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { label: "Día", content: (
                <select value={newBlock.day} onChange={e => setNewBlock({ ...newBlock, day: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  {ALL_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )},
              { label: "Materia", content: (
                <Input placeholder="Ej: Cálculo I" value={newBlock.subject}
                  onChange={e => setNewBlock({ ...newBlock, subject: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleAddBlock()} className="text-sm" />
              )},
              { label: "Inicio",  content: <Input type="time" value={newBlock.startTime} onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })} className="text-sm" /> },
              { label: "Fin",     content: <Input type="time" value={newBlock.endTime}   onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })}   className="text-sm" /> },
            ].map(({ label, content }) => (
              <div key={label} className="space-y-1">
                <Label className="text-xs font-medium">{label}</Label>
                {content}
              </div>
            ))}
          </div>

          {blockError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
              <AlertTriangle size={14} className="shrink-0" /> {blockError}
            </div>
          )}
          {overlapResult !== null && (
            <div className={cn("flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-3",
              overlapResult > 0 ? "text-orange-700 bg-orange-50 border border-orange-200" : "text-[#578426] bg-[#8DC63F]/10 border border-[#8DC63F]/30")}>
              {overlapResult > 0
                ? <><AlertTriangle size={14} /> {overlapResult} tutoría(s) se superponen con tu horario</>
                : <><CheckCircle2 size={14} /> ¡Ninguna tutoría se superpone! Todas están disponibles</>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAddBlock} className="gap-2 bg-[#00AEEF] hover:bg-[#0090C5] text-white">
              <Plus size={15} /> Agregar clase
            </Button>
            <Button onClick={checkSolapamientos} variant="outline" className="gap-2">
              <CheckCircle2 size={15} /> Verificar solapamientos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card className="mb-6 border border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays size={16} className="text-[#00AEEF]" /> Vista semanal — 6:00 a 20:00
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#00AEEF]" /> Clase</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#6B2D8B]" /> Tutoría inscrita</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex gap-1 mb-2 pl-16">
              {ALL_DAYS.map(day => (
                <div key={day} className="flex-1 text-center text-xs font-semibold text-muted-foreground pb-2 border-b border-border/60">{day}</div>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="w-14 shrink-0">
                {HOURS_RANGE.map(hour => (
                  <div key={hour} className="h-16 flex items-start pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{hour}</span>
                  </div>
                ))}
              </div>
              {ALL_DAYS.map(day => (
                <div key={day} className="flex-1 relative border-l border-border/30">
                  {HOURS_RANGE.map(hour => (
                    <div key={hour} className="h-16 border-t border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors" />
                  ))}
                  {combinedSchedule.filter(b => b.day === day).map(block => {
                    const topPct    = ((timeToMin(block.startTime) - 360) / 840) * 100;
                    const heightPct = ((timeToMin(block.endTime) - timeToMin(block.startTime)) / 840) * 100;
                    return (
                      <div key={block.id}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-[10px] overflow-hidden shadow-sm border flex flex-col justify-between group/block z-10 transition-shadow hover:shadow-md",
                          block.isTutoring ? "bg-[#6B2D8B] text-white border-[#5a2576]" : "bg-[#00AEEF] text-white border-[#0090C5]",
                          block.isPast && "opacity-50 grayscale"
                        )}
                        style={{ top: `${topPct}%`, height: `${heightPct}%`, minHeight: "32px" }}>
                        <div>
                          <p className="font-semibold leading-tight line-clamp-2">{block.subject}</p>
                          <p className="opacity-80 mt-0.5">{block.startTime}–{block.endTime}</p>
                          {block.isPast && <span className="text-[8px] bg-white/20 px-1 rounded">Finalizada</span>}
                        </div>
                        {!block.isPast && (
                          <button onClick={() => handleRemoveBlock(block.id, block.session_id)}
                            className="hidden group-hover/block:flex items-center gap-0.5 text-white/70 hover:text-white mt-1 transition-colors">
                            <Trash2 size={9} /> {block.isTutoring ? "Cancelar" : "Eliminar"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorías inscritas */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen size={18} className="text-[#00AEEF]" /> Tutorías inscritas
            <Badge variant="secondary" className="text-xs">{filteredEnrolled.length}</Badge>
          </h2>
          <Button variant={filtersOpen ? "default" : "outline"} size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn("gap-2", filtersOpen && "bg-[#00AEEF] hover:bg-[#0090C5] border-[#00AEEF]")}>
            <Filter size={14} /> Filtros
            {activeFiltersCount > 0 && (
              <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-white text-[#00AEEF]">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>

        {filtersOpen && (
          <Card className="mb-4 border border-border/60 animate-fade-in">
            <CardContent className="pt-4">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar tutoría o tutor..." value={searchTutoring}
                    onChange={e => setSearchTutoring(e.target.value)} className="pl-10" />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger><SelectValue placeholder="Todas las materias" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-card" />
              </div>
              {activeFiltersCount > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs h-7"><X size={12} /> Limpiar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <div className="h-6 w-6 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mr-3" />
            Cargando tutorías inscritas...
          </div>
        ) : filteredEnrolled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
            <BookOpen size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">No tienes tutorías inscritas aún</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnrolled.map(t => (
              <TutoringCard key={t.id}
                tutoring={{
                  id: t.id, subject: t.subject, tutor: t.tutor_name,
                  room: t.room || "Pendiente",
                  date: new Date(t.date_time).toLocaleDateString("es-CO"),
                  time: new Date(t.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  duration: `${t.duration} min`, spotsAvailable: 0, spots: 0, accessibility: ["Inscrito"],
                }}
                isEnrolled={true}
                onEnrollSuccess={async () => { await fetchEnrolledSessions(); await fetchAllSessions(); }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Schedule;