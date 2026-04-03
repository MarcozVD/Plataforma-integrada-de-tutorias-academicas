import { useState, useEffect, useMemo } from "react";
import {
  Calendar, MapPin, User, Star, Sparkles, Loader2, XCircle,
  Clock, BookOpen, Building2, CheckCircle2, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const isPast = (dateStr: string) => new Date(dateStr) < new Date();

const History = () => {
  const { toast } = useToast();
  const [sessions, setSessions]                     = useState<any[]>([]);
  const [availableTutorings, setAvailableTutorings] = useState<any[]>([]);
  const [allRooms, setAllRooms]                     = useState<any[]>([]);
  const [loading, setLoading]                       = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchSessions(), fetchTutorings(), fetchRooms()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/auth/student/enrolled-sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch {}
  };

  const fetchTutorings = async () => {
    try {
      const res = await fetch("/auth/sessions");
      if (res.ok) setAvailableTutorings(await res.json());
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("/auth/rooms");
      if (res.ok) setAllRooms(await res.json());
    } catch {}
  };

  const handleCancel = async (sessionId: number) => {
    if (!confirm("¿Cancelar esta tutoría? El cupo quedará disponible para otro estudiante.")) return;
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/auth/sessions/${sessionId}/enroll`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Tutoría cancelada", description: "Se ha liberado tu cupo exitosamente." });
        fetchSessions();
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cancelar la tutoría." });
      }
    } catch { toast({ variant: "destructive", title: "Error de conexión" }); }
  };

  // Lógica original del compañero: insights dinámicos calculados desde datos reales
  const insights = useMemo(() => {
    const pastSessions = sessions.filter(s => isPast(s.date_time));
    const subjectCounts = sessions.reduce((acc: any, s: any) => {
      acc[s.subject] = (acc[s.subject] || 0) + 1; return acc;
    }, {});
    const topSubject = Object.keys(subjectCounts).sort((a,b) => subjectCounts[b] - subjectCounts[a])[0];

    const recommendedSession = availableTutorings.find(t =>
      t.subject === topSubject && new Date(t.date_time) > new Date() && !sessions.some(s => s.id === t.id)
    );

    const roomCounts = pastSessions.reduce((acc: any, s: any) => {
      if (s.room) acc[s.room] = (acc[s.room] || 0) + 1; return acc;
    }, {});

    const sortedRooms = Object.entries(roomCounts)
      .sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)
      .map(([roomName, count]) => {
        const roomData = allRooms.find(r => r.name === roomName) || { building: "Campus" };
        return { id: roomName, name: roomName, building: roomData.building, visits: count as number };
      });

    return { topSubject, recommendedSession, sortedRooms };
  }, [sessions, availableTutorings, allRooms]);

  const upcoming = sessions.filter(s => !isPast(s.date_time));
  const past     = sessions.filter(s =>  isPast(s.date_time));
  const fullName = localStorage.getItem("fullName") || "";

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">

      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mis tutorías</h1>
        <p className="text-muted-foreground mt-1">Historial y gestión de tus inscripciones académicas</p>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total inscritas", value: sessions.length, icon: <BookOpen size={18} />,    bg: "bg-[#00AEEF]/10", color: "text-[#0090C5]" },
          { label: "Próximas",        value: upcoming.length, icon: <CheckCircle2 size={18} />, bg: "bg-[#8DC63F]/10", color: "text-[#578426]" },
          { label: "Finalizadas",     value: past.length,     icon: <Clock size={18} />,        bg: "bg-muted",        color: "text-muted-foreground" },
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

      {/* Recomendaciones dinámicas */}
      {!loading && sessions.length > 0 && (
        <section className="mb-6 rounded-xl border border-[#00AEEF]/20 bg-[#00AEEF]/4 p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3 text-[#0090C5]">
            <Sparkles size={14} /> Basado en tu actividad
          </h2>
          <div className="grid sm:grid-cols-3 gap-2">
            {insights.recommendedSession ? (
              <div className="rounded-lg border border-[#00AEEF]/15 bg-white dark:bg-card px-3 py-2.5 hover:border-[#00AEEF]/30 transition-colors cursor-pointer">
                <p className="text-xs font-semibold text-foreground leading-tight">Nueva tutoría de {insights.topSubject}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Hay cupos el {new Date(insights.recommendedSession.date_time).toLocaleDateString("es-CO")} a las{" "}
                  {new Date(insights.recommendedSession.date_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[#00AEEF]/15 bg-white dark:bg-card px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {insights.topSubject ? `Sueles asistir a ${insights.topSubject}` : "Explora nuevas tutorías"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">No hay nuevas sesiones programadas por ahora.</p>
              </div>
            )}
            {insights.sortedRooms.length > 0 ? (
              <div className="rounded-lg border border-[#00AEEF]/15 bg-white dark:bg-card px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground leading-tight">{insights.sortedRooms[0].name} es tu favorito</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Es el salón que más has visitado este semestre ({insights.sortedRooms[0].visits} veces).
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[#00AEEF]/15 bg-white dark:bg-card px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground leading-tight">Tu historial de salones</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pronto identificaremos tus lugares favoritos.</p>
              </div>
            )}
            <div className="rounded-lg border border-[#00AEEF]/15 bg-white dark:bg-card px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground leading-tight">Has asistido a {past.length} sesiones</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">¡Sigue así manteniendo tu ritmo de estudio!</p>
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 gap-1">
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
            <BookOpen size={13} /> Mi actividad
            <Badge variant="secondary" className="text-xs ml-1">{sessions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2 data-[state=active]:bg-[#8DC63F] data-[state=active]:text-white">
            <Building2 size={13} /> Salones habituales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="h-6 w-6 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mr-3" />
              Cargando tus tutorías...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
              <BookOpen size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium mb-3">Aún no te has inscrito en ninguna tutoría</p>
              <Link to="/index">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Explorar tutorías <ChevronRight size={13} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#8DC63F]" /> Próximas ({upcoming.length})
                  </h3>
                  <div className="space-y-2">
                    {upcoming.map(t => <SessionRow key={t.id} session={t} isPastSession={false} onCancel={handleCancel} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Finalizadas ({past.length})
                  </h3>
                  <div className="space-y-2">
                    {past.map(t => <SessionRow key={t.id} session={t} isPastSession={true} onCancel={handleCancel} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="h-6 w-6 rounded-full border-2 border-[#8DC63F] border-t-transparent animate-spin mr-3" />
              Cargando información...
            </div>
          ) : insights.sortedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
              <Building2 size={36} className="mb-3 opacity-20" />
              <p className="text-sm">Todavía no tienes un historial de salones visitados.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.sortedRooms.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 hover:border-[#8DC63F]/30 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8DC63F]/10">
                      <MapPin size={16} className="text-[#578426]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.building}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 gap-1 text-[11px] bg-[#FF9900]/8 border-[#FF9900]/25 text-[#e08800]">
                    <Star size={10} className="fill-[#FF9900] text-[#FF9900]" />
                    {r.visits} visita{r.visits !== 1 && "s"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

// Subcomponente fila de sesión
const SessionRow = ({ session: t, isPastSession, onCancel }: { session: any; isPastSession: boolean; onCancel: (id: number) => void }) => {
  const dt      = new Date(t.date_time);
  const dateStr = dt.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all",
      isPastSession ? "border-border/40 bg-muted/20 opacity-70" : "border-[#8DC63F]/30 bg-[#8DC63F]/4 hover:border-[#8DC63F]/50 hover:shadow-sm")}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isPastSession ? "bg-muted" : "bg-[#00AEEF]/10")}>
          <Calendar size={18} className={isPastSession ? "text-muted-foreground" : "text-[#0090C5]"} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground">{t.subject}</h3>
            {isPastSession
              ? <Badge variant="secondary" className="text-[9px] uppercase">Finalizada</Badge>
              : <Badge className="text-[9px] uppercase bg-[#8DC63F]/15 text-[#578426] border border-[#8DC63F]/30">Próxima</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-[#578426] font-medium"><User size={11} /> {t.tutor_name}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {t.room || "Aula por confirmar"}</span>
            <span className="flex items-center gap-1"><Calendar size={11} /> {dateStr}</span>
            <span className="flex items-center gap-1 font-semibold text-foreground"><Clock size={11} /> {timeStr}</span>
          </div>
        </div>
      </div>
      {!isPastSession && (
        <Button variant="ghost" size="sm" onClick={() => onCancel(t.id)}
          className="shrink-0 gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 self-start sm:self-center">
          <XCircle size={13} /> Cancelar
        </Button>
      )}
    </div>
  );
};

export default History;