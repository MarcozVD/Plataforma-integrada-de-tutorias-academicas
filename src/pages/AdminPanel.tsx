import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Users, BookOpen, Building2, Trash2, Plus, ShieldCheck, Loader2,
  MapPin, Accessibility, Eye, History as HistoryIcon, User as UserIcon,
  Calendar, Filter, X, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BLOCKS    = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const WEEK_DAYS = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-[#6B2D8B]/10 text-[#6B2D8B] border-[#6B2D8B]/30",
  tutor:   "bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30",
  student: "bg-[#00AEEF]/10 text-[#0090C5] border-[#00AEEF]/30",
};

const AdminPanel = () => {
  const { toast }  = useToast();
  const location   = useLocation(); // Lógica original del compañero: hash navigation

  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers]         = useState<any[]>([]);
  const [sessions, setSessions]   = useState<any[]>([]);
  const [rooms, setRooms]         = useState<any[]>([]);
  const [userSearch, setUserSearch]                   = useState("");
  const [selectedFilterBlock, setSelectedFilterBlock] = useState("all");
  const [selectedUserDetail, setSelectedUserDetail]   = useState<any>(null);
  const [detailLoading, setDetailLoading]             = useState(false);

  const [newRoom, setNewRoom] = useState<any>({
    name: "", building: "Bloque A", capacity: 30,
    accessibility_wheelchair: false, accessibility_visual: false, accessibility_hearing: false,
    availabilities: [],
  });
  const [tempAvailability, setTempAvailability] = useState({
    day: "Lunes", specific_date: "", start_time: "08:00", end_time: "10:00",
  });
  const [availabilityType, setAvailabilityType] = useState<"recurring"|"specific">("recurring");

  // Lógica original del compañero: navegación por hash
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash === "usuarios" || hash === "users")         setActiveTab("users");
    else if (hash === "tutorias" || hash === "sessions") setActiveTab("sessions");
    else if (hash === "salones"  || hash === "rooms")    setActiveTab("rooms");
    else if (!hash) setActiveTab("users");
  }, [location.hash]);

  useEffect(() => { fetchAllData(); }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchAllData = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [uRes, sRes, rRes] = await Promise.all([
        fetch("/auth/admin/users",    { headers }),
        fetch("/auth/admin/sessions", { headers }),
        fetch("/auth/admin/rooms",    { headers }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setSessions(await sRes.json());
      if (rRes.ok) setRooms(await rRes.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchUserDetail = async (userId: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/auth/admin/users/${userId}/detail`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setSelectedUserDetail(await res.json());
      else toast({ variant: "destructive", title: "Error al cargar detalles" });
    } catch { toast({ variant: "destructive", title: "Error de conexión" }); }
    finally { setDetailLoading(false); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;
    const res = await fetch(`/auth/admin/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) { toast({ title: "Usuario eliminado" }); fetchAllData(); }
    else { const d = await res.json(); toast({ variant: "destructive", title: "Error", description: d.detail || "No se pudo eliminar" }); }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("¿Eliminar esta tutoría?")) return;
    const res = await fetch(`/auth/admin/sessions/${sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) { toast({ title: "Sesión eliminada" }); fetchAllData(); }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/auth/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(newRoom),
    });
    if (res.ok) {
      toast({ title: "Salón creado con éxito" });
      setNewRoom({ name: "", building: "Bloque A", capacity: 30, accessibility_wheelchair: false, accessibility_visual: false, accessibility_hearing: false, availabilities: [] });
      fetchAllData();
    } else { const d = await res.json(); toast({ variant: "destructive", title: "Error", description: d.detail }); }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("¿Eliminar este salón?")) return;
    const res = await fetch(`/auth/admin/rooms/${roomId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) { toast({ title: "Salón eliminado" }); fetchAllData(); }
  };

  const filteredRooms = selectedFilterBlock === "all" ? rooms : rooms.filter(r => r.building === `Bloque ${selectedFilterBlock}`);
  const filteredUsers = userSearch ? users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.university_id.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  ) : users;

  const statsData = [
    { label: "Usuarios",  value: users.length,    icon: <Users size={18} />,    bg: "bg-[#00AEEF]/10", color: "text-[#0090C5]" },
    { label: "Tutorías",  value: sessions.length,  icon: <BookOpen size={18} />, bg: "bg-[#8DC63F]/10", color: "text-[#578426]" },
    { label: "Salones",   value: rooms.length,     icon: <Building2 size={18} />,bg: "bg-[#FF9900]/10", color: "text-[#e08800]" },
    { label: "Inscritos", value: sessions.reduce((a,s)=>a+(s.spots-(s.spots_available??s.spots)),0),
      icon: <TrendingUp size={18} />, bg: "bg-[#6B2D8B]/10", color: "text-[#6B2D8B]" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-[#6B2D8B] border-t-transparent animate-spin" />
      <p className="text-sm">Cargando panel de administración...</p>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

      <section className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B2D8B] shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Panel de administración</h1>
            <p className="text-muted-foreground text-sm">Gestión global de la plataforma UNAB</p>
          </div>
        </div>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map(s => (
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

      {/* Tabs con hash navigation */}
      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        const hashMap: Record<string, string> = { users: "usuarios", sessions: "tutorias", rooms: "salones" };
        window.history.pushState(null, "", `#${hashMap[val]}`);
      }} className="space-y-5">

        {/* Usuarios */}
        <TabsContent value="users">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base">Cuentas registradas</CardTitle>
                <CardDescription>Estudiantes, tutores y administradores</CardDescription>
              </div>
              <Input placeholder="Buscar usuario..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-48 h-8 text-sm" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/30">
                    <tr>
                      {["ID Universidad","Nombre","Correo","Rol","Carrera","Acciones"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-[#0090C5]">{u.university_id}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{u.full_name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize", ROLE_BADGE[u.user_type] ?? ROLE_BADGE.student)}>
                            {u.user_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{u.carrera || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0090C5] hover:bg-[#00AEEF]/10" onClick={() => fetchUserDetail(u.id)}>
                              <Eye size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)} disabled={u.university_id === "admin"}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No se encontraron usuarios.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutorías */}
        <TabsContent value="sessions">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base">Tutorías activas</CardTitle>
              <CardDescription>Todas las tutorías programadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen size={36} className="mb-3 opacity-20" />
                  <p className="text-sm">No hay tutorías registradas</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sessions.map(s => {
                    const available = s.spots_available ?? s.spots;
                    const ratio     = available / s.spots;
                    return (
                      <div key={s.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-card p-3 hover:border-[#8DC63F]/30 transition-all">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 rounded-full bg-[#8DC63F] shrink-0" />
                            <h3 className="font-semibold text-sm text-foreground leading-tight">{s.subject}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 pl-4"><Users size={10} /> {s.tutor_name}</p>
                          {s.room && <p className="text-xs text-muted-foreground flex items-center gap-1 pl-4"><MapPin size={10} /> {s.room}</p>}
                          <div className="pl-4">
                            <Badge variant="outline" className={cn("text-[10px]",
                              ratio <= 0.2 ? "bg-red-50 text-red-700 border-red-200" :
                              ratio <= 0.5 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                            "bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30")}>
                              {available}/{s.spots} cupos
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSession(s.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salones */}
        <TabsContent value="rooms">
          <div className="grid lg:grid-cols-4 gap-5">
            <div className="lg:col-span-1">
              <Card className="border border-border/60 shadow-sm sticky top-20">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus size={15} className="text-[#6B2D8B]" /> Añadir salón
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleCreateRoom} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nombre</Label>
                      <Input placeholder="Ej: Aula 201" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Edificio / Bloque</Label>
                      <Select value={newRoom.building.replace("Bloque ","")} onValueChange={v => setNewRoom({ ...newRoom, building: `Bloque ${v}` })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{BLOCKS.map(b => <SelectItem key={b} value={b}>Bloque {b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Capacidad</Label>
                      <Input type="number" min={1} value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })} required />
                    </div>
                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accesibilidad</Label>
                      {[
                        { key: "accessibility_wheelchair", label: "Silla de ruedas" },
                        { key: "accessibility_visual",     label: "Apoyo visual"    },
                        { key: "accessibility_hearing",    label: "Apoyo auditivo"  },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={newRoom[key]} onCheckedChange={c => setNewRoom({ ...newRoom, [key]: !!c })}
                            className="data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]" />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Horarios regulares</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Si no agregas horarios, el salón estará disponible para cualquier hora.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                        {(["recurring","specific"] as const).map(type => (
                          <button key={type} type="button"
                            onClick={() => { setAvailabilityType(type); setTempAvailability({ ...tempAvailability, day: type==="recurring"?"Lunes":"", specific_date: type==="specific"?new Date().toISOString().split("T")[0]:"" }); }}
                            className={cn("rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                              availabilityType === type ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                            {type === "recurring" ? "Recurrente" : "Fecha única"}
                          </button>
                        ))}
                      </div>
                      {availabilityType === "recurring" ? (
                        <Select value={tempAvailability.day} onValueChange={v => setTempAvailability({ ...tempAvailability, day: v, specific_date: "" })}>
                          <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Día" /></SelectTrigger>
                          <SelectContent>{WEEK_DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input type="date" value={tempAvailability.specific_date}
                          onChange={e => setTempAvailability({ ...tempAvailability, specific_date: e.target.value, day: "" })} className="text-xs h-8" />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Inicio</Label>
                          <Input type="time" value={tempAvailability.start_time} className="text-xs h-8"
                            onChange={e => setTempAvailability({ ...tempAvailability, start_time: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Fin</Label>
                          <Input type="time" value={tempAvailability.end_time} className="text-xs h-8"
                            onChange={e => setTempAvailability({ ...tempAvailability, end_time: e.target.value })} />
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="w-full text-xs h-7 gap-1"
                        onClick={() => {
                          if (availabilityType === "recurring" && !tempAvailability.day) return;
                          if (availabilityType === "specific"  && !tempAvailability.specific_date) return;
                          setNewRoom({ ...newRoom, availabilities: [...newRoom.availabilities, { ...tempAvailability }] });
                        }}>
                        <Plus size={11} /> Añadir horario
                      </Button>
                      {newRoom.availabilities.length > 0 && (
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {newRoom.availabilities.map((av: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[10px] bg-[#00AEEF]/8 border border-[#00AEEF]/15 px-2 py-1 rounded-md">
                              <span className="font-medium text-[#0090C5]">
                                {av.day || new Date(av.specific_date+"T00:00:00").toLocaleDateString("es-CO",{day:"numeric",month:"short"})}
                                {" · "}{av.start_time}–{av.end_time}
                              </span>
                              <button type="button" onClick={() => setNewRoom({ ...newRoom, availabilities: newRoom.availabilities.filter((_:any,i:number)=>i!==idx) })}
                                className="text-muted-foreground hover:text-red-500 transition-colors"><X size={11} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="w-full gap-2 bg-[#6B2D8B] hover:bg-[#5a2576] text-white">
                      <Plus size={14} /> Crear salón
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="border border-border/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">Salones del campus</CardTitle>
                    <CardDescription>Visualización por bloques</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={13} className="text-muted-foreground" />
                    <Select value={selectedFilterBlock} onValueChange={setSelectedFilterBlock}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los bloques</SelectItem>
                        {BLOCKS.map(b => <SelectItem key={b} value={b}>Bloque {b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-8">
                  {filteredRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Building2 size={36} className="mb-3 opacity-20" />
                      <p className="text-sm">No se encontraron salones registrados</p>
                    </div>
                  ) : (
                    Array.from(new Set(filteredRooms.map(r => r.building))).sort().map(block => {
                      const blockRooms = filteredRooms.filter(r => r.building === block);
                      return (
                        <div key={block}>
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6B2D8B] shrink-0">
                              <Building2 size={12} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{block}</span>
                            <span className="text-xs text-muted-foreground">· {blockRooms.length} {blockRooms.length===1?"salón":"salones"}</span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {blockRooms.map(r => (
                              <div key={r.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-card p-3 hover:border-[#6B2D8B]/30 hover:shadow-sm transition-all">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">{r.name}</span>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/25">Cap. {r.capacity}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {r.accessibility_wheelchair && <span title="Silla de ruedas" className="flex h-5 w-5 items-center justify-center rounded bg-[#00AEEF]/10"><Accessibility size={10} className="text-[#0090C5]" /></span>}
                                    {r.accessibility_visual     && <span title="Apoyo visual"   className="flex h-5 w-5 items-center justify-center rounded bg-[#8DC63F]/10 text-[#578426] text-[8px] font-bold">V</span>}
                                    {r.accessibility_hearing    && <span title="Apoyo auditivo" className="flex h-5 w-5 items-center justify-center rounded bg-[#FF9900]/10 text-[#e08800] text-[8px] font-bold">A</span>}
                                  </div>
                                  {r.availabilities?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {r.availabilities.map((av: any, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[9px] h-4 px-1.5 bg-[#00AEEF]/8 border-[#00AEEF]/20 text-[#0090C5]">
                                          {av.day ? av.day.substring(0,3) : new Date(av.specific_date+"T00:00:00").toLocaleDateString("es-CO",{day:"numeric",month:"short"})}
                                          : {av.start_time}–{av.end_time}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRoom(r.id)}>
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal detalle usuario */}
      <Dialog open={!!selectedUserDetail} onOpenChange={open => !open && setSelectedUserDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-[#6B2D8B] border-t-transparent animate-spin" />
            </div>
          ) : selectedUserDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6B2D8B]">
                    <UserIcon size={16} className="text-white" />
                  </div>
                  {selectedUserDetail.full_name}
                </DialogTitle>
                <DialogDescription>Información detallada y actividad en la plataforma</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-5 mt-4">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos básicos</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      {[
                        ["ID académico",  <span className="font-mono font-bold text-[#0090C5] text-xs">{selectedUserDetail.university_id}</span>],
                        ["Correo",        <span className="text-xs truncate">{selectedUserDetail.email}</span>],
                        ["Rol",           <Badge variant="outline" className={cn("text-[10px] capitalize w-fit", ROLE_BADGE[selectedUserDetail.user_type] ?? ROLE_BADGE.student)}>{selectedUserDetail.user_type}</Badge>],
                        ["Carrera",       <span className="text-xs">{selectedUserDetail.carrera || "No especificada"}</span>],
                        ["Miembro desde", <span className="text-xs">{new Date(selectedUserDetail.created_at).toLocaleDateString("es-CO")}</span>],
                      ].map(([label, value], i) => (
                        <div key={i} className="contents">
                          <span className="text-muted-foreground text-xs">{label}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedUserDetail.disability && (
                    <div className="rounded-xl border border-[#FF9900]/20 bg-[#FF9900]/5 p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-[#e08800] uppercase tracking-wide flex items-center gap-1.5">
                        <Accessibility size={12} /> Discapacidad / Apoyo
                      </h4>
                      <p className="text-sm font-semibold text-foreground">{selectedUserDetail.disability.type}</p>
                      <p className="text-xs text-muted-foreground italic">{selectedUserDetail.disability.description || "Sin descripción adicional"}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <HistoryIcon size={12} />
                    {selectedUserDetail.user_type === "tutor" ? "Tutorías dictadas" : "Tutorías inscritas"}
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {!selectedUserDetail.history?.length ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground rounded-xl border-2 border-dashed border-border">
                        <HistoryIcon size={24} className="mb-2 opacity-20" />
                        <p className="text-xs">No hay actividad registrada</p>
                      </div>
                    ) : (
                      selectedUserDetail.history.map((h: any) => (
                        <div key={h.id} className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5 hover:border-[#6B2D8B]/20 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">{h.subject}</span>
                            <Badge variant="secondary" className="text-[9px] uppercase shrink-0">{h.type === "created" ? "Dictada" : "Inscrita"}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar size={9} /> {new Date(h.date_time).toLocaleDateString("es-CO")}</span>
                            <span className="flex items-center gap-1"><MapPin size={9} /> {h.room || "Aula por confirmar"}</span>
                            {h.tutor_name && <span className="text-[#0090C5] font-medium">Tutor: {h.tutor_name}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminPanel;