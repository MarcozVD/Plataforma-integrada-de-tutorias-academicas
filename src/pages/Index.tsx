import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, BookOpen, Building2, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RoomCard from "@/components/RoomCard";
import TutoringCard from "@/components/TutoringCard";
import RecommendationCard from "@/components/RecommendationCard";
import { rooms } from "@/data/mockData";

const Index = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [realTutorings, setRealTutorings] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const userType = localStorage.getItem("userType");
  const [loading, setLoading] = useState(true);

  // filtros de tutorías
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("");
  const [accessFilters, setAccessFilters] = useState({
    wheelchair: false,
    visual: false,
    hearing: false
  });

  // filtros de salones
  const [onlyAvailableRooms, setOnlyAvailableRooms] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTutorings(), fetchEnrolled()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchEnrolled = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("/auth/student/enrolled-sessions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEnrolledIds(new Set(data.map((s: any) => s.id)));
      }
    } catch (err) {
      console.error("Error fetching enrolled:", err);
    }
  };

  const fetchTutorings = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = userType === "tutor" ? "/auth/tutor/sessions" : "/auth/sessions";
      const headers: any = {};
      if (userType === "tutor") headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        // Mapear datos reales al formato que espera TutoringCard
        const mappedData = data.map((t: any) => {
          const dt = new Date(t.date_time);
          return {
            id: t.id,
            subject: t.subject,
            tutor: t.tutor_name,
            room: t.room || "Pendiente",
            date: dt.toLocaleDateString(),
            time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${t.duration} min`,
            spotsAvailable: t.spots_available,
            spots: t.spots,
            accessibility: t.accessibility_type ? [t.accessibility_type] : ["General"]
          };
        });
        setRealTutorings(mappedData);
      }
    } catch (err) {
      console.error("Error fetching tutorings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tutorías
  const filteredTutorings = useMemo(() => {
    return realTutorings.filter((t) => {
      // Filtro por búsqueda
      const matchSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.tutor.toLowerCase().includes(search.toLowerCase()) ||
        t.room.toLowerCase().includes(search.toLowerCase());

      // Filtro por materia
      const matchSubject = subjectFilter === "all" ||
        t.subject.toLowerCase().includes(subjectFilter.toLowerCase());

      // Filtro por fecha
      const matchDate = !dateFilter || t.date === new Date(dateFilter).toLocaleDateString();

      // Filtro por hora
      let matchTime = true;
      if (timeFilter) {
        matchTime = t.time.includes(timeFilter);
      }

      // Filtro por accesibilidad
      let matchAccess = true;
      if (accessFilters.wheelchair && !t.accessibility.includes("Movilidad reducida")) matchAccess = false;
      if (accessFilters.visual && !t.accessibility.includes("Visual")) matchAccess = false;
      if (accessFilters.hearing && !t.accessibility.includes("Auditiva")) matchAccess = false;

      return matchSearch && matchSubject && matchDate && matchTime && matchAccess;
    });
  }, [search, subjectFilter, dateFilter, timeFilter, realTutorings]);

  // Filtrar salones
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Filtro por búsqueda
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());

      // Filtro por disponibilidad
      const matchAvailable = !onlyAvailableRooms || r.available;

      // Filtro por accesibilidad
      const matchAccess =
        (!accessFilters.wheelchair || r.accessibility.wheelchair) &&
        (!accessFilters.visual || r.accessibility.visualSupport) &&
        (!accessFilters.hearing || r.accessibility.hearingSupport);

      return matchSearch && matchAvailable && matchAccess;
    });
  }, [search, onlyAvailableRooms, accessFilters]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setDateFilter("");
    setTimeFilter("");
    setAccessFilters({ wheelchair: false, visual: false, hearing: false });
    setOnlyAvailableRooms(false);
  };

  // Contador de filtros activos
  const activeFiltersCount = [
    subjectFilter !== "all",
    dateFilter !== "",
    timeFilter !== "",
    accessFilters.wheelchair,
    accessFilters.visual,
    accessFilters.hearing,
    onlyAvailableRooms
  ].filter(Boolean).length;

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px] animate-fade-in group">
      {/* Hero */}
      <section className="mb-8" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Encuentra tu espacio de aprendizaje
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Busca salones disponibles y {userType === 'tutor' ? 'gestiona tus tutorías programadas' : 'tutorías académicas en tu universidad'}
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por materia, tutor, salón..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base bg-card"
              aria-label="Buscar salones o tutorías"
            />
          </div>
          <Button
            variant={filtersOpen ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-label="Filtros avanzados"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        {filtersOpen && (
          <div className="bg-card rounded-lg border p-4 mb-4" role="region" aria-label="Filtros avanzados">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Materia */}
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

              {/* Fecha */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Fecha</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-card"
                />
              </div>

              {/* Hora */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Hora</Label>
                <Input
                  type="time"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-card"
                />
              </div>

              {/* Accesibilidad */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Accesibilidad</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="wheelchair"
                      checked={accessFilters.wheelchair}
                      onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, wheelchair: !!c }))}
                    />
                    <Label htmlFor="wheelchair" className="text-xs">Silla de ruedas</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visual"
                      checked={accessFilters.visual}
                      onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, visual: !!c }))}
                    />
                    <Label htmlFor="visual" className="text-xs">Apoyo visual</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hearing"
                      checked={accessFilters.hearing}
                      onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, hearing: !!c }))}
                    />
                    <Label htmlFor="hearing" className="text-xs">Apoyo auditivo</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtro solo salones disponibles */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="onlyAvailable"
                  checked={onlyAvailableRooms}
                  onCheckedChange={(c) => setOnlyAvailableRooms(!!c)}
                />
                <Label htmlFor="onlyAvailable" className="text-sm">Solo mostrar salones disponibles</Label>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Limpiar filtros ({activeFiltersCount})
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="mb-8" aria-labelledby="recs-heading">
        <h2 id="recs-heading" className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" /> {userType === 'tutor' ? 'Resumen para ti' : 'Recomendaciones para ti'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecommendationCard
            title="Tutoría de Álgebra Lineal mañana"
            reason="Coincide con tu hora libre de 09:00 a 10:00"
          />
          <RecommendationCard
            title="Aula 201 disponible ahora"
            reason="Es accesible y la usas frecuentemente"
          />
          <RecommendationCard
            title="María García dicta Cálculo I"
            reason="Es la materia que más consultas"
          />
        </div>
      </section>

      {/* Main content tabs */}
      <Tabs defaultValue="tutorings" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="tutorings" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> {userType === 'tutor' ? 'Mis Tutorías Programadas' : 'Tutorías Disponibles'}
            <Badge variant="secondary" className="ml-1 text-xs">{filteredTutorings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Salones
            <Badge variant="secondary" className="ml-1 text-xs">{filteredRooms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorings">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p>Cargando {userType === 'tutor' ? 'tus tutorías' : 'tutorías disponibles'}...</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTutorings.map((t) => (
                  <TutoringCard
                    key={t.id}
                    tutoring={t}
                    isEnrolled={enrolledIds.has(t.id)}
                    onEnrollSuccess={async () => {
                      await fetchTutorings();
                      await fetchEnrolled();
                    }}
                  />
                ))}
              </div>
              {filteredTutorings.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  No se encontraron tutorías con los filtros seleccionados.
                </p>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
          {filteredRooms.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No se encontraron salones con los filtros seleccionados.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Index;
