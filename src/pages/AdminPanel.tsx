import { useState, useEffect } from "react";
import { Users, BookOpen, Building2, Trash2, Plus, ShieldCheck, Loader2, MapPin, Accessibility, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const AdminPanel = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    // Form state for new room
    const [newRoom, setNewRoom] = useState({
        name: "",
        building: "",
        capacity: 30,
        accessibility_wheelchair: false,
        accessibility_visual: false,
        accessibility_hearing: false
    });

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
                toast({ variant: "destructive", title: "Error", description: data.detail });
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
                    building: "",
                    capacity: 30,
                    accessibility_wheelchair: false,
                    accessibility_visual: false,
                    accessibility_hearing: false
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
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)} disabled={u.university_id === 'admin'}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                        {/* Create Room Form */}
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
                                            <Label>Edificio</Label>
                                            <Input placeholder="Ej: Bloque A" value={newRoom.building} onChange={e => setNewRoom({ ...newRoom, building: e.target.value })} required />
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

                                        <Button className="w-full gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="h-4 w-4" /> Crear Salón
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Rooms List */}
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Salones del Campus</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {rooms.map(r => (
                                            <Card key={r.id} className="border-2 border-indigo-50">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                    <div className="flex gap-4 items-center">
                                                        <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Building2 className="h-6 w-6" /></div>
                                                        <div>
                                                            <h3 className="font-bold text-indigo-900">{r.name}</h3>
                                                            <p className="text-xs text-muted-foreground">{r.building} • Cap: {r.capacity}</p>
                                                            <div className="flex gap-1 mt-1">
                                                                {r.accessibility_wheelchair && <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center" title="Silla Ruedas"><Accessibility className="h-3 w-3" /></div>}
                                                                {r.accessibility_visual && <div className="h-4 w-4 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold text-[8px]" title="Visual">V</div>}
                                                                {r.accessibility_hearing && <div className="h-4 w-4 bg-amber-100 text-amber-600 rounded flex items-center justify-center font-bold text-[8px]" title="Auditivo">A</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteRoom(r.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
};

export default AdminPanel;
