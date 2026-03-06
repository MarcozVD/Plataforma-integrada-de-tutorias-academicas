import { useState, useEffect } from "react";
import { Users, BookOpen, Building2, Trash2, Plus, ShieldCheck, Loader2, MapPin, Accessibility, Check, X, Eye, History as HistoryIcon, User as UserIcon, Calendar, Filter } from "lucide-react";
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

const AdminPanel = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    // Campus Blocks
    const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const [selectedFilterBlock, setSelectedFilterBlock] = useState<string | "all">("all");

    // User details modal
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Form state for new room
    const [newRoom, setNewRoom] = useState<any>({
        name: "",
        building: "Bloque A",
        capacity: 30,
        accessibility_wheelchair: false,
        accessibility_visual: false,
        accessibility_hearing: false,
        availabilities: []
    });

    const [tempAvailability, setTempAvailability] = useState({
        day: "Lunes",
        specific_date: "",
        start_time: "08:00",
        end_time: "10:00"
    });

    const [availabilityType, setAvailabilityType] = useState<"recurring" | "specific">("recurring");

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        try {
            const [uRes, sRes, rRes] = await Promise.all([
                fetch("/auth/admin/users", { headers }),
                fetch("/auth/admin/sessions", { headers }),
                fetch("/auth/admin/rooms", { headers })
            ]);

            if (uRes.ok) setUsers(await uRes.json());
            if (sRes.ok) setSessions(await sRes.json());
            if (rRes.ok) setRooms(await rRes.json());
        } catch (err) {
            console.error("Error fetching admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (userId: number) => {
        setDetailLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/auth/admin/users/${userId}/detail`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedUserDetail(data);
            } else {
                toast({ variant: "destructive", title: "Error al cargar detalles" });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error de conexión" });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("¿Eliminar este usuario definitivamente?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/auth/admin/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: "Usuario eliminado" });
                fetchAllData();
            } else {
                const data = await res.json();
                const msg = data.detail || "Error al eliminar";
                toast({ variant: "destructive", title: "Error", description: msg });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error de conexión" });
        }
    };

    const handleDeleteSession = async (sessionId: number) => {
        if (!confirm("¿Eliminar esta tutoría? Todos los inscritos serán notificados (simulado).")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/auth/admin/sessions/${sessionId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: "Sesión eliminada" });
                fetchAllData();
            }
        } catch (err) { }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("/auth/admin/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newRoom)
            });
            if (res.ok) {
                toast({ title: "Salón creado con éxito" });
                setNewRoom({
                    name: "",
                    building: "Bloque A",
                    capacity: 30,
                    accessibility_wheelchair: false,
                    accessibility_visual: false,
                    accessibility_hearing: false,
                    availabilities: []
                });
                fetchAllData();
            } else {
                const data = await res.json();
                toast({ variant: "destructive", title: "Error", description: data.detail });
            }
        } catch (err) { }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm("¿Eliminar este salón?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/auth/admin/rooms/${roomId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: "Salón eliminado" });
                fetchAllData();
            }
        } catch (err) { }
    };

    const filteredRooms = selectedFilterBlock === "all"
        ? rooms
        : rooms.filter(r => r.building === `Bloque ${selectedFilterBlock}`);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <main className="container mx-auto px-4 py-8 max-w-[1600px]">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-10 w-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-muted-foreground">Gestión global de la plataforma PITA</p>
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="users" className="gap-2 px-6"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
                    <TabsTrigger value="sessions" className="gap-2 px-6"><BookOpen className="h-4 w-4" /> Tutorías</TabsTrigger>
                    <TabsTrigger value="rooms" className="gap-2 px-6"><Building2 className="h-4 w-4" /> Salones</TabsTrigger>
                </TabsList>

                {/* --- USERS TAB --- */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuentas Registradas</CardTitle>
                            <CardDescription>Estudiantes, tutores y administradores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-4 py-3">ID Universidad</th>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Correo</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Carrera</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-muted/30">
                                                <td className="px-4 py-4 font-mono font-bold text-indigo-700">{u.university_id}</td>
                                                <td className="px-4 py-4 font-medium">{u.full_name}</td>
                                                <td className="px-4 py-4 text-muted-foreground">{u.email}</td>
                                                <td className="px-4 py-4">
                                                    <Badge className={u.user_type === 'admin' ? 'bg-red-50 text-red-700' : u.user_type === 'tutor' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}>
                                                        {u.user_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 truncate max-w-[200px]">{u.carrera || '-'}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="text-indigo-600 hover:bg-indigo-50" onClick={() => fetchUserDetail(u.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)} disabled={u.university_id === 'admin'}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- SESSIONS TAB --- */}
                <TabsContent value="sessions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tutorías Activas</CardTitle>
                            <CardDescription>Todas las tutorías programadas en el sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessions.map(s => (
                                    <Card key={s.id} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex justify-between items-start">
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-indigo-900">{s.subject}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Tutor: {s.tutor_name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {s.room}</p>
                                                <Badge variant="outline" className="mt-2">{s.spots_available}/{s.spots} inscritos</Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteSession(s.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ROOMS TAB --- */}
                <TabsContent value="rooms">
                    <div className="grid lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Añadir Salón</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateRoom} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nombre del Salón</Label>
                                            <Input placeholder="Ej: Aula 201" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Edificio / Bloque</Label>
                                            <Select value={newRoom.building.replace("Bloque ", "")} onValueChange={v => setNewRoom({ ...newRoom, building: `Bloque ${v}` })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar bloque" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BLOCKS.map(b => (
                                                        <SelectItem key={b} value={b}>Bloque {b}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Capacidad</Label>
                                            <Input type="number" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })} required />
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">Accesibilidad</Label>
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="r_wheel" checked={newRoom.accessibility_wheelchair} onCheckedChange={c => setNewRoom({ ...newRoom, accessibility_wheelchair: !!c })} />
                                                <label htmlFor="r_wheel" className="text-sm">Rampas / Silla Ruedas</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="r_vis" checked={newRoom.accessibility_visual} onCheckedChange={c => setNewRoom({ ...newRoom, accessibility_visual: !!c })} />
                                                <label htmlFor="r_vis" className="text-sm">Auxiliar Visual</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="r_hear" checked={newRoom.accessibility_hearing} onCheckedChange={c => setNewRoom({ ...newRoom, accessibility_hearing: !!c })} />
                                                <label htmlFor="r_hear" className="text-sm">Auxiliar Auditivo</label>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">Horarios Libres (Disponibilidad)</Label>

                                            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-2">
                                                <Button
                                                    type="button"
                                                    variant={availabilityType === "recurring" ? "default" : "ghost"}
                                                    size="sm"
                                                    className="flex-1 text-[10px] h-7"
                                                    onClick={() => {
                                                        setAvailabilityType("recurring");
                                                        setTempAvailability({ ...tempAvailability, specific_date: "", day: "Lunes" });
                                                    }}
                                                >
                                                    Recurrente (Día)
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={availabilityType === "specific" ? "default" : "ghost"}
                                                    size="sm"
                                                    className="flex-1 text-[10px] h-7"
                                                    onClick={() => {
                                                        setAvailabilityType("specific");
                                                        setTempAvailability({ ...tempAvailability, day: "", specific_date: new Date().toISOString().split('T')[0] });
                                                    }}
                                                >
                                                    Fecha Única
                                                </Button>
                                            </div>

                                            {availabilityType === "recurring" ? (
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground uppercase">Día de la Semana</Label>
                                                    <Select
                                                        value={tempAvailability.day || ""}
                                                        onValueChange={v => setTempAvailability({ ...tempAvailability, day: v, specific_date: "" })}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                                                        <SelectContent>
                                                            {["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"].map(d => (
                                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground uppercase">Seleccionar Fecha</Label>
                                                    <Input
                                                        type="date"
                                                        value={tempAvailability.specific_date}
                                                        onChange={e => setTempAvailability({ ...tempAvailability, specific_date: e.target.value, day: "" })}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground uppercase">Hora Inicio</Label>
                                                    <Input type="time" value={tempAvailability.start_time} onChange={e => setTempAvailability({ ...tempAvailability, start_time: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground uppercase">Hora Fin</Label>
                                                    <Input type="time" value={tempAvailability.end_time} onChange={e => setTempAvailability({ ...tempAvailability, end_time: e.target.value })} />
                                                </div>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => {
                                                if (availabilityType === "recurring" && !tempAvailability.day) return;
                                                if (availabilityType === "specific" && !tempAvailability.specific_date) return;

                                                setNewRoom({
                                                    ...newRoom,
                                                    availabilities: [...newRoom.availabilities, { ...tempAvailability }]
                                                });
                                            }}>
                                                + Añadir Horario
                                            </Button>

                                            <div className="space-y-1 mt-2 max-h-[120px] overflow-y-auto pr-1">
                                                {newRoom.availabilities.map((av: any, idx: number) => (
                                                    <div key={idx} className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 p-1.5 px-2 rounded-md flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 opacity-70" />
                                                            <span className="font-medium">
                                                                {av.day ? av.day : new Date(av.specific_date + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                            <span className="opacity-50">|</span>
                                                            <span>{av.start_time}-{av.end_time}</span>
                                                        </div>
                                                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-red-600 transition-colors" onClick={() => {
                                                            const filtered = newRoom.availabilities.filter((_: any, i: number) => i !== idx);
                                                            setNewRoom({ ...newRoom, availabilities: filtered });
                                                        }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button className="w-full gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="h-4 w-4" /> Crear Salón
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Salones del Campus</CardTitle>
                                        <CardDescription>Visualización por bloques</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <Select value={selectedFilterBlock} onValueChange={setSelectedFilterBlock}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="Filtrar Bloque" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos los Bloques</SelectItem>
                                                {BLOCKS.map(b => (
                                                    <SelectItem key={b} value={b}>Bloque {b}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-8">
                                        {Array.from(new Set(filteredRooms.map(r => r.building))).sort().map(block => (
                                            <div key={block} className="space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-2">
                                                    <Badge className="bg-indigo-600 text-white font-bold">{block}</Badge>
                                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                                        {filteredRooms.filter(r => r.building === block).length} salones registrados
                                                    </h3>
                                                </div>
                                                <div className="grid sm:grid-cols-1 xl:grid-cols-2 gap-4">
                                                    {filteredRooms.filter(r => r.building === block).map(r => (
                                                        <Card key={r.id} className="border-2 border-indigo-50 hover:border-indigo-100 transition-all group shadow-sm hover:shadow-md">
                                                            <CardContent className="p-4 flex justify-between items-start">
                                                                <div className="flex gap-4 items-start">
                                                                    <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                                        <Building2 className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">{r.name}</h3>
                                                                            <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-emerald-50 text-emerald-700 border-none">CAP: {r.capacity}</Badge>
                                                                        </div>

                                                                        <div className="flex gap-1.5">
                                                                            {r.accessibility_wheelchair && <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center" title="Silla Ruedas"><Accessibility className="h-2.5 w-2.5" /></div>}
                                                                            {r.accessibility_visual && <div className="h-4 w-4 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold text-[8px]" title="Visual">V</div>}
                                                                            {r.accessibility_hearing && <div className="h-4 w-4 bg-amber-100 text-amber-600 rounded flex items-center justify-center font-bold text-[8px]" title="Auditivo">A</div>}
                                                                        </div>

                                                                        {r.availabilities && r.availabilities.length > 0 && (
                                                                            <div className="mt-3 space-y-1">
                                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Disponibilidad:</p>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {r.availabilities.map((av: any, idx: number) => (
                                                                                        <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0 h-5 bg-white border-indigo-100 text-indigo-700 font-medium">
                                                                                            <span className="opacity-70 mr-1">
                                                                                                {av.day ? av.day.substring(0, 3) : new Date(av.specific_date + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}:
                                                                                            </span>
                                                                                            {av.start_time} - {av.end_time}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1" onClick={() => handleDeleteRoom(r.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {filteredRooms.length === 0 && (
                                            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                                                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                                                <p className="text-muted-foreground font-medium">No se encontraron salones registrados</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- USER DETAIL DIALOG --- */}
            <Dialog open={!!selectedUserDetail} onOpenChange={(open) => !open && setSelectedUserDetail(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedUserDetail && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-2xl">
                                    <UserIcon className="h-6 w-6 text-indigo-600" />
                                    Perfil de {selectedUserDetail.full_name}
                                </DialogTitle>
                                <DialogDescription>
                                    Información detallada y actividad en la plataforma
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="space-y-4">
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                        <h4 className="font-bold text-sm uppercase text-muted-foreground">Datos Básicos</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-muted-foreground">ID Académico:</span>
                                            <span className="font-bold">{selectedUserDetail.university_id}</span>
                                            <span className="text-muted-foreground">Correo:</span>
                                            <span className="font-medium">{selectedUserDetail.email}</span>
                                            <span className="text-muted-foreground">Rol:</span>
                                            <Badge variant="outline" className="w-fit uppercase text-[10px]">{selectedUserDetail.user_type}</Badge>
                                            <span className="text-muted-foreground">Carrera:</span>
                                            <span className="font-medium">{selectedUserDetail.carrera || 'No especificada'}</span>
                                            <span className="text-muted-foreground">Miembro desde:</span>
                                            <span className="text-xs">{new Date(selectedUserDetail.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {selectedUserDetail.disability && (
                                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2">
                                            <h4 className="font-bold text-sm uppercase text-amber-700 flex items-center gap-2">
                                                <Accessibility className="h-4 w-4" /> Discapacidad / Apoyo
                                            </h4>
                                            <p className="text-sm font-bold text-amber-900">{selectedUserDetail.disability.type}</p>
                                            <p className="text-xs text-amber-800 italic">{selectedUserDetail.disability.description || 'Sin descripción adicional'}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                                        <HistoryIcon className="h-4 w-4" /> {selectedUserDetail.user_type === 'tutor' ? 'Tutorías Dictadas' : 'Tutorías Inscritas'}
                                    </h4>

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {selectedUserDetail.history && selectedUserDetail.history.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic py-8 text-center bg-muted/20 rounded-lg">
                                                No hay actividad registrada aún.
                                            </p>
                                        ) : (
                                            selectedUserDetail.history?.map((h: any) => (
                                                <div key={h.id} className="p-3 border rounded-lg hover:border-indigo-200 transition-colors bg-white shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <h5 className="font-bold text-indigo-900 text-sm">{h.subject}</h5>
                                                        <Badge variant="secondary" className="text-[9px] uppercase">
                                                            {h.type === 'created' ? 'Dictada' : 'Inscrita'}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(h.date_time).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {h.room || 'Aula por confirmar'}</span>
                                                        {h.tutor_name && <span className="col-span-2 text-indigo-700 font-medium">Tutor: {h.tutor_name}</span>}
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
        </main >
    );
};

export default AdminPanel;
