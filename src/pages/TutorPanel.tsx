import { useState, useEffect } from "react";
import {
  GraduationCap, Clock, Plus, Loader2, Users, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Wifi, Building2,
  AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BLOCKS    = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const MONTHS    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEK_DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const TutorPanel = () => {
  const [sessions, setSessions]               = useState<any[]>([]);
  const [tutoringSubjects, setTutoringSubjects] = useState<string[]>([]);
  const [availableRooms, setAvailableRooms]   = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [fetchingRooms, setFetchingRooms]     = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);

  // Lógica original del compañero: modal de estudiantes
  const [selectedSessionStudents, setSelectedSessionStudents] = useState<any[] | null>(null);
  const [fetchingStudents, setFetchingStudents]               = useState(false);

  const [isVirtual, setIsVirtual]         = useState(false);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [currentMonth, setCurrentMonth]  = useState(new Date());

  const [newSession, setNewSession] = useState({
    subject: "", date: "", time: "", duration: 60, spots: 5, room: "", accessibility_type: "",
  });

  // Nombre del tutor desde localStorage
  const fullName  = localStorage.getItem("fullName") || "";
  const firstName = fullName.split(" ")[0] || "Tutor";

  useEffect(() => { fetchUserData(); fetchSessions(); }, []);

  useEffect(() => {
    if (!newSession.date || !newSession.time) return;
    const load = async () => {
      setFetchingRooms(true);
      try {
        const res = await fetch(`/auth/rooms/available?date=${newSession.date}&time=${newSession.time}&duration=${newSession.duration}`);
        if (res.ok) setAvailableRooms(await res.json());
      } catch {} finally { setFetchingRooms(false); }
    };
    load();
  }, [newSession.date, newSession.time, newSession.duration]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setTutoringSubjects(d.interest_subjects || []); }
    } catch {}
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/tutor/sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch { setError("No se pudieron cargar las sesiones"); }
    finally { setLoading(false); }
  };

  const handleCreateSession = async () => {
    setError("");
    if (!newSession.subject || !newSession.date || !newSession.time) {
      setError("Completa los campos obligatorios: materia, fecha y hora."); return;
    }
    setCreatingSession(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/tutor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: newSession.subject, date_time: `${newSession.date}T${newSession.time}:00`,
          duration: newSession.duration, spots: newSession.spots,
          room: newSession.room, accessibility_type: newSession.accessibility_type,
        }),
      });
      if (!res.ok) throw new Error();
      await fetchSessions();
      setNewSession({ subject: "", date: "", time: "", duration: 60, spots: 5, room: "", accessibility_type: "" });
      setIsVirtual(false); setSelectedBlock("");
      setSuccess(true); setTimeout(() => setSuccess(false), 4000);
    } catch { setError("Error al crear la sesión. Inténtalo de nuevo."); }
    finally { setCreatingSession(false); }
  };

  // Lógica original del compañero: ver estudiantes inscritos
  const handleViewStudents = async (sessionId: number) => {
    setFetchingStudents(true);
    setSelectedSessionStudents([]);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/auth/tutor/sessions/${sessionId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSelectedSessionStudents(await res.json());
    } catch {} finally { setFetchingStudents(false); }
  };

  // Calendario
  const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay  = new Date(year, month, 1).getDay();
  const today     = new Date();
  const isToday   = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const calendarCells = () => {
    const cells = [];
    for (let i = 0; i < startDay; i++)
      cells.push(<div key={`e-${i}`} className="h-24 border-b border-r border-border/30 bg-muted/10" />);
    for (let day = 1; day <= totalDays; day++) {
      const dateStr    = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const daySessions = sessions.filter(s => s.date_time.startsWith(dateStr));
      cells.push(
        <div key={day} className={cn("h-24 border-b border-r border-border/30 p-1.5 overflow-y-auto transition-colors",
          isToday(day) ? "bg-[#00AEEF]/5" : "hover:bg-muted/20")}>
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
            isToday(day) ? "bg-[#00AEEF] text-white" : "text-muted-foreground")}>
            {day}
          </span>
          <div className="flex flex-col gap-0.5 mt-1">
            {daySessions.map(s => (
              <div key={s.id} title={`${s.date_time.split("T")[1]?.substring(0,5)} — ${s.subject}`}
                className="text-[9px] px-1 py-0.5 bg-[#00AEEF]/15 text-[#0090C5] rounded border border-[#00AEEF]/20 truncate font-medium">
                {s.date_time.split("T")[1]?.substring(0,5)} {s.subject}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  const filteredRooms    = availableRooms.filter(r => !selectedBlock || r.building === selectedBlock);
  const totalStudents    = sessions.reduce((acc, s) => acc + (s.spots - (s.spots_available ?? s.spots)), 0);
  const upcomingSessions = sessions.filter(s => new Date(s.date_time) > new Date()).length;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <LayoutDashboard size={24} className="text-[#00AEEF]" /> Panel del tutor
        </h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {firstName} — gestiona tus sesiones de tutoría</p>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Sesiones totales", value: sessions.length, icon: <GraduationCap size={18} />, bg: "bg-[#00AEEF]/10", color: "text-[#0090C5]" },
          { label: "Próximas",         value: upcomingSessions, icon: <Clock size={18} />,         bg: "bg-[#8DC63F]/10", color: "text-[#578426]" },
          { label: "Estudiantes",      value: totalStudents,    icon: <Users size={18} />,         bg: "bg-[#6B2D8B]/10", color: "text-[#6B2D8B]" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.bg)}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Columna izquierda */}
        <div className="lg:col-span-1 space-y-6">

          {/* Formulario */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus size={16} className="text-[#00AEEF]" /> Programar tutoría
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Materia <span className="text-red-500">*</span></Label>
                <select value={newSession.subject} onChange={e => setNewSession({ ...newSession, subject: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  <option value="">Selecciona una materia...</option>
                  {tutoringSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Fecha <span className="text-red-500">*</span></Label>
                  <Input type="date" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Hora <span className="text-red-500">*</span></Label>
                  <Input type="time" value={newSession.time} onChange={e => setNewSession({ ...newSession, time: e.target.value })} className="text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Cupos</Label>
                  <Input type="number" min={1} value={newSession.spots} onChange={e => setNewSession({ ...newSession, spots: parseInt(e.target.value) })} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Duración (min)</Label>
                  <Input type="number" min={15} step={15} value={newSession.duration} onChange={e => setNewSession({ ...newSession, duration: parseInt(e.target.value) })} className="text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Modalidad</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setIsVirtual(false); setNewSession({ ...newSession, room: "" }); }}
                    className={cn("flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors",
                      !isVirtual ? "bg-[#00AEEF] text-white border-[#00AEEF]" : "bg-muted text-muted-foreground border-border")}>
                    <Building2 size={13} /> En campus
                  </button>
                  <button onClick={() => { setIsVirtual(true); setSelectedBlock(""); setNewSession({ ...newSession, room: "" }); }}
                    className={cn("flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors",
                      isVirtual ? "bg-[#6B2D8B] text-white border-[#6B2D8B]" : "bg-muted text-muted-foreground border-border")}>
                    <Wifi size={13} /> Virtual
                  </button>
                </div>
              </div>

              {!isVirtual ? (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Filtrar por bloque</Label>
                    <select className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}>
                      <option value="">Todos los bloques</option>
                      {BLOCKS.map(b => <option key={b} value={`Bloque ${b}`}>Bloque {b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide flex items-center gap-1">
                      Salón disponible {fetchingRooms && <Loader2 size={10} className="animate-spin" />}
                      <span className="ml-auto font-normal">({filteredRooms.length})</span>
                    </Label>
                    <select className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      disabled={!newSession.date || !newSession.time || fetchingRooms}
                      value={newSession.room} onChange={e => setNewSession({ ...newSession, room: e.target.value })}>
                      <option value="">{fetchingRooms ? "Buscando..." : !newSession.date || !newSession.time ? "Primero selecciona fecha y hora" : "Seleccionar salón..."}</option>
                      {filteredRooms.map(r => <option key={r.id} value={r.name}>{r.name} — Cap. {r.capacity}</option>)}
                    </select>
                    {filteredRooms.length === 0 && newSession.date && newSession.time && !fetchingRooms && (
                      <p className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1.5 rounded-md">No hay salones disponibles en este horario.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Link de la sesión</Label>
                  <Input placeholder="https://meet.google.com/..." value={newSession.room}
                    onChange={e => setNewSession({ ...newSession, room: e.target.value })} className="text-sm" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Discapacidad atendida</Label>
                <select value={newSession.accessibility_type} onChange={e => setNewSession({ ...newSession, accessibility_type: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40">
                  <option value="">Ninguna / General</option>
                  <option value="Movilidad reducida">Movilidad reducida</option>
                  <option value="Auditiva">Auditiva</option>
                  <option value="Visual">Visual</option>
                  <option value="Cognitiva">Cognitiva</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  <AlertTriangle size={13} className="shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-[#578426] bg-[#8DC63F]/10 border border-[#8DC63F]/30 px-3 py-2 rounded-lg">
                  <CheckCircle2 size={13} className="shrink-0" /> ¡Sesión creada exitosamente!
                </div>
              )}

              <Button onClick={handleCreateSession} disabled={creatingSession}
                className="w-full gap-2 bg-[#00AEEF] hover:bg-[#0090C5] text-white font-semibold">
                {creatingSession ? <><Loader2 size={15} className="animate-spin" /> Creando...</> : <><Plus size={15} /> Crear sesión</>}
              </Button>
            </CardContent>
          </Card>

          {/* Próximas tutorías con "Ver inscritos" */}
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
              <Clock size={15} className="text-[#00AEEF]" /> Próximas tutorías
              <Badge variant="secondary" className="text-xs">{sessions.slice(0,5).length}</Badge>
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="h-5 w-5 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mr-2" /> Cargando...
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-6 text-center text-muted-foreground text-sm">No hay sesiones programadas aún</div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0,5).map(s => {
                  const dt        = new Date(s.date_time);
                  const dateStr   = dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
                  const timeStr   = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const available = s.spots_available ?? s.spots;
                  const ratio     = available / s.spots;
                  return (
                    <div key={s.id} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 hover:border-[#00AEEF]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00AEEF]/10">
                          <GraduationCap size={16} className="text-[#0090C5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{s.subject}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarIcon size={10} /> {dateStr} · {timeStr}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 text-[10px] font-semibold",
                          ratio <= 0.2 ? "bg-red-50 text-red-700 border-red-200" :
                          ratio <= 0.5 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                         "bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30")}>
                          {available}/{s.spots}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewStudents(s.id)}
                        className="mt-2 w-full h-7 text-xs border-[#00AEEF]/30 text-[#0090C5] hover:bg-[#00AEEF]/8 gap-1">
                        <Users size={12} /> Ver inscritos
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Calendario */}
        <div className="lg:col-span-2">
          <Card className="border border-border/60 shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#00AEEF]" /> {MONTHS[month]} {year}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentMonth(new Date(year, month - 1))}><ChevronLeft size={14} /></Button>
                  <Button variant="outline" size="sm"
                    className="h-8 px-3 text-xs font-medium text-[#00AEEF] border-[#00AEEF]/30 hover:bg-[#00AEEF]/5"
                    onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentMonth(new Date(year, month + 1))}><ChevronRight size={14} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-border/40">
                {WEEK_DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">{calendarCells()}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal estudiantes */}
      {selectedSessionStudents !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedSessionStudents(null); }}>
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={16} className="text-[#00AEEF]" /> Estudiantes inscritos
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSessionStudents(null)} className="h-8 w-8 rounded-full">
                <X size={14} />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
              {fetchingStudents ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <div className="h-5 w-5 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mr-2" /> Cargando...
                </div>
              ) : selectedSessionStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground rounded-xl border-2 border-dashed border-border">
                  <Users size={28} className="mb-2 opacity-20" />
                  <p className="text-sm">No hay estudiantes inscritos aún</p>
                </div>
              ) : (
                selectedSessionStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card hover:border-[#00AEEF]/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00AEEF]/10 text-[#0090C5] font-bold text-sm">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    {student.carrera && <Badge variant="outline" className="text-[10px] shrink-0">{student.carrera}</Badge>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
};

export default TutorPanel;