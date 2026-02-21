import { useState } from "react";
import { Search, Filter, SlidersHorizontal, BookOpen, Building2, Sparkles } from "lucide-react";
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
import { rooms, tutorings } from "@/data/mockData";

const Index = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accessFilters, setAccessFilters] = useState({ wheelchair: false, visual: false, hearing: false });

  const filteredRooms = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    const matchAccess =
      (!accessFilters.wheelchair || r.accessibility.wheelchair) &&
      (!accessFilters.visual || r.accessibility.visualSupport) &&
      (!accessFilters.hearing || r.accessibility.hearingSupport);
    return matchSearch && matchAccess;
  });

  const filteredTutorings = tutorings.filter(
    (t) => t.subject.toLowerCase().includes(search.toLowerCase()) || t.tutor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Hero */}
      <section className="mb-8" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Encuentra tu espacio de aprendizaje
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Busca salones disponibles y tutorías académicas en tu universidad
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
            variant="outline"
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
          <div className="bg-card rounded-lg border p-4 mb-4 grid sm:grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Filtros avanzados">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Materia</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="calculo">Cálculo I</SelectItem>
                  <SelectItem value="prog">Programación II</SelectItem>
                  <SelectItem value="algebra">Álgebra Lineal</SelectItem>
                  <SelectItem value="fisica">Física II</SelectItem>
                  <SelectItem value="estadistica">Estadística</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Fecha</Label>
              <Input type="date" className="bg-card" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Hora</Label>
              <Input type="time" className="bg-card" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Accesibilidad</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="wheelchair" checked={accessFilters.wheelchair} onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, wheelchair: !!c }))} />
                  <Label htmlFor="wheelchair" className="text-xs">Silla de ruedas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="visual" checked={accessFilters.visual} onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, visual: !!c }))} />
                  <Label htmlFor="visual" className="text-xs">Apoyo visual</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="hearing" checked={accessFilters.hearing} onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, hearing: !!c }))} />
                  <Label htmlFor="hearing" className="text-xs">Apoyo auditivo</Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="mb-8" aria-labelledby="recs-heading">
        <h2 id="recs-heading" className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" /> Recomendaciones para ti
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
            <BookOpen className="h-4 w-4" /> Tutorías
            <Badge variant="secondary" className="ml-1 text-xs">{filteredTutorings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Salones
            <Badge variant="secondary" className="ml-1 text-xs">{filteredRooms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorings">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorings.map((t) => (
              <TutoringCard key={t.id} tutoring={t} />
            ))}
          </div>
          {filteredTutorings.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No se encontraron tutorías.</p>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
          {filteredRooms.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No se encontraron salones.</p>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Index;
