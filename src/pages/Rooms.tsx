import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/RoomCard";
import { rooms } from "@/data/mockData";

const Rooms = () => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [accessFilters, setAccessFilters] = useState({
    wheelchair: false,
    visual: false,
    hearing: false
  });

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      // Filtro por búsqueda
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());

      // Filtro por disponibilidad
      const matchAvailable = !onlyAvailable || r.available;

      // Filtro por accesibilidad
      const matchAccess =
        (!accessFilters.wheelchair || r.accessibility.wheelchair) &&
        (!accessFilters.visual || r.accessibility.visualSupport) &&
        (!accessFilters.hearing || r.accessibility.hearingSupport);

      return matchSearch && matchAvailable && matchAccess;
    });
  }, [search, onlyAvailable, accessFilters]);

  // Contador de filtros activos
  const activeFiltersCount = [
    onlyAvailable,
    accessFilters.wheelchair,
    accessFilters.visual,
    accessFilters.hearing,
  ].filter(Boolean).length;

  // Limpiar filtros
  const clearFilters = () => {
    setSearch("");
    setOnlyAvailable(false);
    setAccessFilters({ wheelchair: false, visual: false, hearing: false });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <h1 className="text-2xl font-bold mb-1">Salones Universitarios</h1>
      <p className="text-muted-foreground mb-6">Consulta disponibilidad y accesibilidad de los salones</p>

      {/* Search and Filter Button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar salón..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Button
          variant={filtersOpen ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-label="Filtros de accesibilidad"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={onlyAvailable}
                onCheckedChange={(c) => setOnlyAvailable(!!c)}
              />
              <Label htmlFor="available" className="text-sm">Solo disponibles</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="wheelchair"
                checked={accessFilters.wheelchair}
                onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, wheelchair: !!c }))}
              />
              <Label htmlFor="wheelchair" className="text-sm">Accesible silla de ruedas</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="visual"
                checked={accessFilters.visual}
                onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, visual: !!c }))}
              />
              <Label htmlFor="visual" className="text-sm">Apoyo visual</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hearing"
                checked={accessFilters.hearing}
                onCheckedChange={(c) => setAccessFilters((p) => ({ ...p, hearing: !!c }))}
              />
              <Label htmlFor="hearing" className="text-sm">Apoyo auditivo</Label>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Limpiar filtros ({activeFiltersCount})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No se encontraron salones con los filtros seleccionados.
        </p>
      )}
    </main>
  );
};

export default Rooms;
