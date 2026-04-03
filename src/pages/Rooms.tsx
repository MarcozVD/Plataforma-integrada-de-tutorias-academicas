import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Building2, CheckCircle2, XCircle, LayoutGrid, List, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RoomCard from "@/components/RoomCard";

const Rooms = () => {
  const [rooms, setRooms]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [view, setView]               = useState<"grid"|"list">("grid");
  const [accessFilters, setAccessFilters] = useState({ wheelchair: false, visual: false, hearing: false });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/auth/rooms");
        if (res.ok) setRooms(await res.json());
      } catch {} finally { setLoading(false); }
    };
    fetchRooms();
  }, []);

  const filtered = useMemo(() => rooms.filter((r) => {
    const hasWheelchair = r.accessibility_wheelchair !== undefined ? r.accessibility_wheelchair : r.accessibility?.wheelchair;
    const hasVisual     = r.accessibility_visual     !== undefined ? r.accessibility_visual     : r.accessibility?.visualSupport;
    const hasHearing    = r.accessibility_hearing    !== undefined ? r.accessibility_hearing    : r.accessibility?.hearingSupport;
    const matchSearch    = r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    const matchAvailable = !onlyAvailable || r.available;
    const matchAccess    = (!accessFilters.wheelchair || hasWheelchair) && (!accessFilters.visual || hasVisual) && (!accessFilters.hearing || hasHearing);
    return matchSearch && matchAvailable && matchAccess;
  }), [rooms, search, onlyAvailable, accessFilters]);

  const activeFiltersCount = [onlyAvailable, accessFilters.wheelchair, accessFilters.visual, accessFilters.hearing].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setOnlyAvailable(false); setAccessFilters({ wheelchair: false, visual: false, hearing: false }); };

  const totalRooms     = rooms.length;
  const availableCount = rooms.filter(r => r.available).length;
  const occupiedCount  = totalRooms - availableCount;
  const buildings      = new Set(rooms.map(r => r.building)).size;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

      <section className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Aulas universitarias</h1>
            <p className="text-muted-foreground mt-1">Consulta disponibilidad y accesibilidad en tiempo real</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["grid","list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  view === v ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                {v === "grid" ? "Grid" : "Lista"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total aulas",  value: totalRooms,     icon: <Building2    size={18} />, bg: "bg-[#00AEEF]/10", color: "text-[#0090C5]" },
          { label: "Disponibles",  value: availableCount, icon: <CheckCircle2 size={18} />, bg: "bg-[#8DC63F]/10", color: "text-[#578426]" },
          { label: "Ocupadas",     value: occupiedCount,  icon: <XCircle      size={18} />, bg: "bg-red-100",       color: "text-red-600"   },
          { label: "Edificios",    value: buildings,      icon: <Building2    size={18} />, bg: "bg-[#6B2D8B]/10", color: "text-[#6B2D8B]" },
        ].map((s) => (
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

      {/* Búsqueda */}
      <section className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o edificio..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card" />
          </div>
          <Button variant={filtersOpen ? "default" : "outline"}
            className={cn("h-11 gap-2 shrink-0", filtersOpen && "bg-[#00AEEF] hover:bg-[#0090C5] border-[#00AEEF]")}
            onClick={() => setFiltersOpen(!filtersOpen)}>
            <SlidersHorizontal size={15} /> Filtros
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#00AEEF]">{activeFiltersCount}</span>
            )}
          </Button>
        </div>

        {filtersOpen && (
          <div className="mt-3 rounded-xl border border-border/60 bg-card p-4 animate-fade-in">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: "available",  label: "Solo disponibles",  special: true  },
                { id: "wheelchair", label: "Silla de ruedas",   special: false },
                { id: "visual",     label: "Apoyo visual",      special: false },
                { id: "hearing",    label: "Apoyo auditivo",    special: false },
              ].map(({ id, label, special }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox id={id}
                    checked={special ? onlyAvailable : accessFilters[id as keyof typeof accessFilters]}
                    onCheckedChange={(c) => special ? setOnlyAvailable(!!c) : setAccessFilters(p => ({ ...p, [id]: !!c }))}
                    className="data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]" />
                  <span className="text-sm text-foreground group-hover:text-[#0090C5] transition-colors">{label}</span>
                </label>
              ))}
            </div>
            {activeFiltersCount > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 gap-1">
                  <X size={12} /> Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Resultados */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mb-4" />
          <p className="text-sm">Cargando aulas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
          <Search size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">No se encontraron aulas con los filtros seleccionados.</p>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 text-xs text-[#00AEEF]">Limpiar filtros</Button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(new Set(filtered.map(r => r.building))).sort().map((building) => {
            const buildingRooms     = filtered.filter(r => r.building === building);
            const buildingAvailable = buildingRooms.filter(r => r.available).length;
            return (
              <section key={building}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AEEF] shrink-0">
                    <Building2 size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-foreground">{building}</h2>
                    <p className="text-xs text-muted-foreground">
                      {buildingRooms.length} {buildingRooms.length === 1 ? "aula" : "aulas"} ·{" "}
                      <span className="text-[#578426] font-medium">{buildingAvailable} disponibles</span>
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[#8DC63F]"
                        style={{ width: `${(buildingAvailable / buildingRooms.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((buildingAvailable / buildingRooms.length) * 100)}%
                    </span>
                  </div>
                </div>
                {view === "grid" ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {buildingRooms.map(r => <RoomCard key={r.id} room={r} />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buildingRooms.map(r => <RoomCard key={r.id} room={r} listView />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Rooms;