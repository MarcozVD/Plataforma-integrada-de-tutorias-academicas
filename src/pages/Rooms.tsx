import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RoomCard from "@/components/RoomCard";
import { rooms } from "@/data/mockData";

const Rooms = () => {
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!onlyAvailable || r.available);
  });

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Salones Universitarios</h1>
      <p className="text-muted-foreground mb-6">Consulta disponibilidad y accesibilidad de los salones</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar salón..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="available" checked={onlyAvailable} onCheckedChange={(c) => setOnlyAvailable(!!c)} />
          <Label htmlFor="available" className="text-sm">Solo disponibles</Label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No se encontraron salones.</p>}
    </main>
  );
};

export default Rooms;
