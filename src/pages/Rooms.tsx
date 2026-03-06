import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/RoomCard";
const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [accessFilters, setAccessFilters] = useState({
    wheelchair: false,
    visual: false,
    hearing: false
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/auth/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      // API uses accessibility_wheelchair etc directly
      const hasWheelchair = r.accessibility_wheelchair;
      const hasVisual = r.accessibility_visual;
      const hasHearing = r.accessibility_hearing;

      // Filtro por búsqueda
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());

      // Filtro por disponibilidad
      const matchAvailable = !onlyAvailable || r.available;

      // Filtro por accesibilidad
      const matchAccess =
        (!accessFilters.wheelchair || hasWheelchair) &&
        (!accessFilters.visual || hasVisual) &&
        (!accessFilters.hearing || hasHearing);

      return matchSearch && matchAvailable && matchAccess;
    });
  }, [rooms, search, onlyAvailable, accessFilters]);

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

      {/* Results grouped by blocks */}
      <div className="space-y-12">
        {Array.from(new Set(filtered.map(r => r.building))).sort().map(block => (
          <div key={block} className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-indigo-100 pb-2">
              <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {block}
              </div>
              <h2 className="text-xl font-bold text-indigo-900">
                {filtered.filter(r => r.building === block).length} {filtered.filter(r => r.building === block).length === 1 ? 'Salón' : 'Salones'} en este bloque
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.filter(r => r.building === block).map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
          <p className="text-muted-foreground font-medium">
            No se encontraron salones con los filtros seleccionados.
          </p>
        </div>
      )}
    </main>
  );
};

export default Rooms;
