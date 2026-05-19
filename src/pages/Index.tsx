import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, BookOpen, Building2, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import RoomCard from "@/components/RoomCard";
import TutoringCard from "@/components/TutoringCard";
import RecommendationCard from "@/components/RecommendationCard";

const Index = () => {
  const [search, setSearch]               = useState("");
  const [filtersOpen, setFiltersOpen]     = useState(false);
  const [realTutorings, setRealTutorings] = useState<any[]>([]);
  const [rooms, setRooms]                 = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds]     = useState<Set<number>>(new Set());
  const [loading, setLoading]             = useState(true);

  // Lógica original del compañero
  const userType = localStorage.getItem("userType");

  const [subjectFilter, setSubjectFilter]       = useState<string>("all");
  const [dateFilter, setDateFilter]             = useState<string>("");
  const [timeFilter, setTimeFilter]             = useState<string>("");
  const [onlyAvailableRooms, setOnlyAvailableRooms] = useState(false);
  const [accessFilters, setAccessFilters]       = useState({ wheelchair: false, visual: false, hearing: false });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTutorings(), fetchEnrolled(), fetchRooms()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/auth/rooms");
      if (res.ok) setRooms(await res.json());
    } catch {}
  };

  const fetchEnrolled = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/auth/student/enrolled-sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolledIds(new Set(data.map((s: any) => s.id)));
      }
    } catch {}
  };

  const fetchTutorings = async () => {
    try {
      const token   = localStorage.getItem("token");
      const url     = userType === "tutor" ? "/auth/tutor/sessions" : "/auth/sessions";
      const headers: any = {};
      if (userType === "tutor") headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setRealTutorings(data.map((t: any) => {
          const dt = new Date(t.date_time);
          return {
            id: t.id, subject: t.subject, tutor: t.tutor_name,
            room: t.room || "Pendiente", rawDate: dt,
            date: dt.toLocaleDateString(),
            time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            duration: `${t.duration} min`,
            spotsAvailable: t.spots_available, spots: t.spots,
            accessibility: t.accessibility_type
              ? [{ visual: "Apoyo visual", auditiva: "Apoyo auditivo", motriz: "Silla de ruedas", cognitiva: "Apoyo cognitivo" }[t.accessibility_type] ?? t.accessibility_type]
              : ["General"],
          };
        }));
      }
    } catch {} finally { setLoading(false); }
  };

  const filteredTutorings = useMemo(() => realTutorings.filter((t) => {
    const matchSearch  = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.tutor.toLowerCase().includes(search.toLowerCase()) || t.room.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === "all" || t.subject.toLowerCase().includes(subjectFilter.toLowerCase());
    const matchDate    = !dateFilter || t.rawDate.toLocaleDateString() === new Date(dateFilter + "T00:00:00").toLocaleDateString();
    const matchTime    = !timeFilter || t.time.startsWith(timeFilter);
    let matchAccess = true;
    if (accessFilters.wheelchair && !t.accessibility.includes("Silla de ruedas")) matchAccess = false;
    if (accessFilters.visual     && !t.accessibility.includes("Apoyo visual"))    matchAccess = false;
    if (accessFilters.hearing    && !t.accessibility.includes("Apoyo auditivo"))  matchAccess = false;
    return matchSearch && matchSubject && matchDate && matchTime && matchAccess;
  }), [search, subjectFilter, dateFilter, timeFilter, realTutorings, accessFilters]);

  const filteredRooms = useMemo(() => rooms.filter((r) => {
    const matchSearch    = r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    const matchAvailable = !onlyAvailableRooms || r.available;
    const matchAccess    = (!accessFilters.wheelchair || r.has_wheelchair_access) &&
      (!accessFilters.visual || r.has_visual_support) &&
      (!accessFilters.hearing || r.has_hearing_support);
    return matchSearch && matchAvailable && matchAccess;
  }), [search, onlyAvailableRooms, accessFilters, rooms]);

  const clearFilters = () => {
    setSearch(""); setSubjectFilter("all"); setDateFilter(""); setTimeFilter("");
    setAccessFilters({ wheelchair: false, visual: false, hearing: false }); setOnlyAvailableRooms(false);
  };

  const activeFiltersCount = [
    subjectFilter !== "all", dateFilter !== "", timeFilter !== "",
    accessFilters.wheelchair, accessFilters.visual, accessFilters.hearing, onlyAvailableRooms,
  ].filter(Boolean).length;

  const fullName  = localStorage.getItem("fullName") || "";
  const firstName = fullName.split(" ")[0] || "";

  return (
    <main className="max-w-7xl mx-auto animate-fade-in">

      {/* ── Banner hero institucional ── */}
      <section className="relative overflow-hidden mb-8 rounded-b-2xl"
        style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 55%, #6B2D8B 100%)" }}>
        {/* Círculos decorativos */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative px-6 py-8 md:py-10 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {firstName && (
                <p className="text-white/75 text-sm mb-1 font-medium">
                  ¡Bienvenido de nuevo, {firstName}! 👋
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Encuentra tu espacio<br className="hidden sm:block" /> de aprendizaje
              </h1>
              <p className="text-white/80 mt-2 text-sm md:text-base">
                {userType === "tutor"
                  ? "Gestiona tus tutorías y conecta con tus estudiantes"
                  : "Busca salones disponibles y tutorías académicas en tu universidad"}
              </p>
            </div>
            {/* Stats rápidas */}
            <div className="flex gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center bg-white/15 rounded-xl px-5 py-3 backdrop-blur-sm">
                <span className="text-2xl font-bold text-white">{realTutorings.length}</span>
                <span className="text-[11px] text-white/75 font-medium">Tutorías</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white/15 rounded-xl px-5 py-3 backdrop-blur-sm">
                <span className="text-2xl font-bold text-white">{rooms.filter(r => r.available).length}</span>
                <span className="text-[11px] text-white/75 font-medium">Aulas libres</span>
              </div>
            </div>
          </div>

          {/* Buscador dentro del banner */}
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por materia, tutor, salón..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-white/95 dark:bg-background border-0 shadow-sm" />
            </div>
            <Button
              variant={filtersOpen ? "secondary" : "secondary"}
              className={cn("h-11 gap-2 shrink-0 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm",
                filtersOpen && "bg-white/30")}
              onClick={() => setFiltersOpen(!filtersOpen)}>
              <SlidersHorizontal className="h-4 w-4" /> Filtros
              {activeFiltersCount > 0 && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-white text-[#00AEEF]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <div className="container mx-auto px-4">

      {/* Panel de filtros */}
      <section className="mb-6">
        {filtersOpen && (
          <div className="bg-card rounded-xl border border-border/60 p-4 mb-4 animate-fade-in">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Materia</Label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {[...new Set(realTutorings.map(t => t.subject))].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Fecha</Label>
                <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-card" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Hora</Label>
                <Input type="time" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-card" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Accesibilidad</Label>
                <div className="space-y-2">
                  {[
                    { id: "wheelchair", label: "Silla de ruedas", key: "wheelchair" as const },
                    { id: "visual",     label: "Apoyo visual",    key: "visual"     as const },
                    { id: "hearing",    label: "Apoyo auditivo",  key: "hearing"    as const },
                  ].map(({ id, label, key }) => (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox id={id} checked={accessFilters[key]}
                        onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, [key]: !!c }))}
                        className="data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]" />
                      <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="onlyAvailable" checked={onlyAvailableRooms}
                  onCheckedChange={(c) => setOnlyAvailableRooms(!!c)}
                  className="data-[state=checked]:bg-[#8DC63F] data-[state=checked]:border-[#8DC63F]" />
                <Label htmlFor="onlyAvailable" className="text-sm cursor-pointer">Solo mostrar salones disponibles</Label>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 h-7">
                  <X size={12} /> Limpiar ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Recomendaciones dinámicas (lógica original del compañero) */}
      <section className="mb-8">
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#FF9900]" />
          {userType === "tutor" ? "Resumen para ti" : "Recomendaciones para ti"}
        </h2>
        {userType === "tutor" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <RecommendationCard title={`${realTutorings.length} Tutorías Programadas`} reason="Total de sesiones creadas en la plataforma" />
            {(() => {
              const now = new Date();
              const upcoming = realTutorings.filter(t => t.rawDate > now).sort((a,b) => a.rawDate.getTime() - b.rawDate.getTime())[0];
              return upcoming
                ? <RecommendationCard title={`Próxima: ${upcoming.subject}`} reason={`${upcoming.date} a las ${upcoming.time} en ${upcoming.room}`} />
                : <RecommendationCard title="Sin próximas sesiones" reason="No tienes tutorías programadas próximamente" />;
            })()}
            {(() => {
              const total = realTutorings.reduce((acc, t) => acc + (t.spots - t.spotsAvailable), 0);
              return <RecommendationCard title={`${total} Estudiantes`} reason="Inscritos en tus diferentes sesiones" />;
            })()}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(() => {
              const now = new Date();
              const available       = realTutorings.filter(t => t.rawDate > now && !enrolledIds.has(t.id));
              const upcomingSession = available.sort((a,b) => a.rawDate.getTime() - b.rawDate.getTime())[0];
              const availableRoom   = rooms.find(r => r.available);
              const anyOther        = available.find(t => t.id !== upcomingSession?.id);
              return (
                <>
                  {upcomingSession
                    ? <RecommendationCard title={`Tutoría de ${upcomingSession.subject} disponible`} reason={`Con ${upcomingSession.tutor} el ${upcomingSession.date} a las ${upcomingSession.time}`} />
                    : <RecommendationCard title="Explora tutorías" reason="Busca sesiones disponibles para afianzar tus conocimientos" />}
                  {availableRoom
                    ? <RecommendationCard title={`${availableRoom.name} disponible ahora`} reason={`En ${availableRoom.building} · capacidad ${availableRoom.capacity} personas`} />
                    : <RecommendationCard title="Busca espacios libres" reason="Revisa la disponibilidad de salones en tu universidad" />}
                  {anyOther
                    ? <RecommendationCard title={`${anyOther.tutor} dicta ${anyOther.subject}`} reason="Aprovecha sus cupos disponibles para prepararte mejor." />
                    : <RecommendationCard title="Conoce a todos los tutores" reason="Tutores dispuestos a ayudarte en la plataforma" />}
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Tabs */}
      <Tabs defaultValue="tutorings" className="mb-8">
        <TabsList className="mb-4 bg-muted/50 p-1 gap-1">
          <TabsTrigger value="tutorings" className="gap-1.5 data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
            <BookOpen className="h-4 w-4" />
            {userType === "tutor" ? "Mis Tutorías Programadas" : "Tutorías Disponibles"}
            <Badge variant="secondary" className="ml-1 text-xs">{filteredTutorings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1.5 data-[state=active]:bg-[#8DC63F] data-[state=active]:text-white">
            <Building2 className="h-4 w-4" /> Salones
            <Badge variant="secondary" className="ml-1 text-xs">{filteredRooms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorings">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mb-4" />
              <p className="text-sm">Cargando {userType === "tutor" ? "tus tutorías" : "tutorías disponibles"}...</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTutorings.map((t) => (
                  <TutoringCard key={t.id} tutoring={t} isEnrolled={enrolledIds.has(t.id)}
                    onEnrollSuccess={async () => { await fetchTutorings(); await fetchEnrolled(); }} />
                ))}
              </div>
              {filteredTutorings.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No se encontraron tutorías con los filtros seleccionados.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
          {filteredRooms.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No se encontraron salones con los filtros seleccionados.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>{/* /container */}
    </main>
  );
};

export default Index;