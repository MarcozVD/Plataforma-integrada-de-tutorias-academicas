import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Clock, Plus, Save, Loader2, Check, X, User, MapPin, Users, Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TutorPanel = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [tutoringSubjects, setTutoringSubjects] = useState<string[]>([]);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creatingSession, setCreatingSession] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [fetchingAvailable, setFetchingAvailable] = useState(false);

    // Selection state
    const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const [selectedBlock, setSelectedBlock] = useState<string>("");
    const [isVirtual, setIsVirtual] = useState(false);

    const [newSession, setNewSession] = useState({
        subject: "",
        date: "",
        time: "",
        duration: 60,
        spots: 5,
        room: "",
        accessibility_type: ""
    });

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchRooms = async () => {
        try {
            const res = await fetch("/auth/rooms");
            if (res.ok) setAllRooms(await res.json());
        } catch (err) { }
    };

    useEffect(() => {
        fetchUserData();
        fetchSessions();
        // fetchRooms(); // We now fetch dynamically based on date/time
    }, []);

    const fetchAvailableRooms = async () => {
        if (!newSession.date || !newSession.time) return;
        setFetchingAvailable(true);
        try {
            const res = await fetch(`/auth/rooms/available?date=${newSession.date}&time=${newSession.time}&duration=${newSession.duration}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableRooms(data);
            }
        } catch (err) {
            console.error("Error fetching available rooms:", err);
        } finally {
            setFetchingAvailable(false);
        }
    };

    useEffect(() => {
        fetchAvailableRooms();
    }, [newSession.date, newSession.time, newSession.duration]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/auth/me", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTutoringSubjects(data.interest_subjects || []);
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/auth/tutor/sessions", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data);
            }
        } catch (err) {
            console.error("Error fetching sessions:", err);
            setError("No se pudieron cargar las sesiones");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!newSession.subject || !newSession.date || !newSession.time) {
            setError("Completa los campos obligatorios");
            return;
        }

        setCreatingSession(true);
        try {
            const token = localStorage.getItem("token");
            const dateTime = `${newSession.date}T${newSession.time}:00`;

            const response = await fetch("/auth/tutor/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: newSession.subject,
                    date_time: dateTime,
                    duration: newSession.duration,
                    spots: newSession.spots,
                    room: newSession.room,
                    accessibility_type: newSession.accessibility_type
                })
            });

            if (!response.ok) throw new Error("Error al crear sesión");

            await fetchSessions();
            setNewSession({
                subject: "",
                date: "",
                time: "",
                duration: 60,
                spots: 5,
                room: "",
                accessibility_type: ""
            });
        } catch (err) {
            setError("Error al crear la sesión");
        } finally {
            setCreatingSession(false);
        }
    };

    // Calendar Logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const days = [];
        // Padding for first week
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-muted/10 border-b border-r"></div>);
        }

        // Actual days
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySessions = sessions.filter(s => s.date_time.startsWith(dateStr));

            days.push(
                <div key={day} className="h-24 border-b border-r p-1 overflow-y-auto hover:bg-muted/5 transition-colors">
                    <span className="text-xs font-semibold text-muted-foreground">{day}</span>
                    <div className="flex flex-col gap-1 mt-1">
                        {daySessions.map(s => (
                            <div
                                key={s.id}
                                className="text-[10px] p-1 bg-indigo-100 text-indigo-700 rounded border border-indigo-200 truncate"
                                title={`${s.time}: ${s.subject}`}
                            >
                                {s.date_time.split('T')[1].substring(0, 5)} {s.subject}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <main className="container mx-auto px-4 py-8 max-w-[1600px]">
            <div className="flex items-center justify-between mb-8 text-center sm:text-left flex-col sm:flex-row gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-900">
                        <LayoutDashboard className="h-8 w-8 text-indigo-600 bg-indigo-50 p-1.5 rounded-lg shadow-sm" /> Panel de Control del Tutor
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">Gestiona tus sesiones y horario de tutorías</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Form & List */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="shadow-xl bg-white border-2 border-indigo-50/50">
                        <CardHeader className="bg-gradient-to-r from-indigo-50/20 to-transparent">
                            <CardTitle className="text-xl flex items-center gap-3 text-indigo-900">
                                <Plus className="h-6 w-6 text-indigo-600" /> Programar Tutoría
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Materia</Label>
                                    <select
                                        value={newSession.subject}
                                        onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                                        className="w-full h-11 px-4 bg-white border-2 border-indigo-50 rounded-xl text-sm"
                                    >
                                        <option value="">Selecciona materia...</option>
                                        {tutoringSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha</Label>
                                        <Input
                                            type="date"
                                            value={newSession.date}
                                            onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                                            className="h-11 border-indigo-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hora</Label>
                                        <Input
                                            type="time"
                                            value={newSession.time}
                                            onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                                            className="h-11 border-indigo-100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cupos</Label>
                                        <Input
                                            type="number"
                                            value={newSession.spots}
                                            onChange={(e) => setNewSession({ ...newSession, spots: parseInt(e.target.value) })}
                                            className="h-11 border-indigo-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duración (min)</Label>
                                        <Input
                                            type="number"
                                            value={newSession.duration}
                                            onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                                            className="h-11 border-indigo-100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ubicación de la Tutoría</Label>

                                    <div className="flex gap-4 mb-2">
                                        <Button
                                            variant={isVirtual ? "outline" : "default"}
                                            size="sm"
                                            className="flex-1 rounded-xl"
                                            onClick={() => setIsVirtual(false)}
                                        >
                                            En Campus
                                        </Button>
                                        <Button
                                            variant={isVirtual ? "default" : "outline"}
                                            size="sm"
                                            className="flex-1 rounded-xl"
                                            onClick={() => {
                                                setIsVirtual(true);
                                                setSelectedBlock("");
                                                setNewSession({ ...newSession, room: "Virtual / Link" });
                                            }}
                                        >
                                            Virtual
                                        </Button>
                                    </div>

                                    {!isVirtual ? (
                                        <div className="grid grid-cols-1 gap-3 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase text-indigo-700">Filtrar por Bloque</Label>
                                                <select
                                                    className="w-full text-xs p-2 border rounded-md bg-white"
                                                    value={selectedBlock}
                                                    onChange={e => setSelectedBlock(e.target.value)}
                                                >
                                                    <option value="">Todos los bloques</option>
                                                    {BLOCKS.map(b => <option key={b} value={`Bloque ${b}`}>Bloque {b}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-indigo-700">
                                                    Salón disponible ({availableRooms.filter(r => !selectedBlock || r.building === selectedBlock).length})
                                                </Label>
                                                <select
                                                    className="w-full text-xs p-2 border rounded-md bg-white shadow-sm"
                                                    disabled={!newSession.date || !newSession.time || fetchingAvailable}
                                                    value={newSession.room}
                                                    onChange={e => setNewSession({ ...newSession, room: e.target.value })}
                                                >
                                                    <option value="">{fetchingAvailable ? "Cargando..." : "Seleccionar salón..."}</option>
                                                    {availableRooms
                                                        .filter(r => !selectedBlock || r.building === selectedBlock)
                                                        .map(r => (
                                                            <option key={r.id} value={r.name}>{r.name} (Cap: {r.capacity})</option>
                                                        ))
                                                    }
                                                </select>
                                                {availableRooms.length === 0 && newSession.date && newSession.time && !fetchingAvailable && (
                                                    <div className="bg-red-50 p-2 rounded border border-red-100 mt-2">
                                                        <p className="text-[9px] text-red-600 font-medium">
                                                            No hay salones disponibles en este horario.
                                                            Verifica que el bloque seleccionado tenga salones habilitados por el admin.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <Input
                                            placeholder="Ingresa el link de la sesión (Zoom, Meet, etc)"
                                            value={newSession.room === "Virtual / Link" ? "" : newSession.room}
                                            onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                                            className="h-11 border-indigo-100"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discapacidad Atendida</Label>
                                    <select
                                        value={newSession.accessibility_type}
                                        onChange={(e) => setNewSession({ ...newSession, accessibility_type: e.target.value })}
                                        className="w-full h-11 px-4 bg-white border-2 border-indigo-50 rounded-xl text-sm"
                                    >
                                        <option value="">Ninguna / General</option>
                                        <option value="Movilidad reducida">Movilidad reducida</option>
                                        <option value="Auditiva">Auditiva</option>
                                        <option value="Visual">Visual</option>
                                        <option value="Cognitiva">Cognitiva</option>
                                    </select>
                                </div>

                                <Button
                                    onClick={handleCreateSession}
                                    disabled={creatingSession}
                                    className="w-full mt-2 h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg text-lg gap-2"
                                >
                                    {creatingSession ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    Crear Sesión
                                </Button>
                                {error && <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                            <Clock className="h-6 w-6 text-indigo-600" /> Próximas Tutorías
                        </h2>
                        <div className="space-y-3">
                            {sessions.slice(0, 5).map(s => (
                                <Card key={s.id} className="hover:border-indigo-400/50 transition-all hover:shadow-md border-2 border-indigo-50 shadow-sm overflow-hidden">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-indigo-900 text-sm">{s.subject}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> {s.date_time.split('T')[0]} @ {s.date_time.split('T')[1].substring(0, 5)}
                                            </p>
                                            {s.accessibility_type && (
                                                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    Inclusivo: {s.accessibility_type}
                                                </Badge>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold border-indigo-100">
                                            {s.spots_available}/{s.spots} cupos
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                            {sessions.length === 0 && <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-xl text-center border-2 border-dashed">No hay tutorías programadas</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Calendar */}
                <div className="lg:col-span-2">
                    <Card className="h-full shadow-2xl overflow-hidden border-2 border-indigo-50/50 bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b-2 border-indigo-50 pb-6 pt-8 bg-indigo-50/10">
                            <div className="flex items-center gap-4">
                                <CalendarIcon className="h-8 w-8 text-indigo-600 bg-white p-1.5 rounded-lg shadow-sm" />
                                <CardTitle className="text-2xl font-bold text-indigo-900">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={prevMonth} className="h-10 w-10 border-indigo-100 hover:bg-indigo-50"><ChevronLeft className="h-5 w-5 text-indigo-600" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-10 px-4 border-indigo-100 font-bold text-indigo-600 hover:bg-indigo-50">Hoy</Button>
                                <Button variant="outline" size="icon" onClick={nextMonth} className="h-10 w-10 border-indigo-100 hover:bg-indigo-50"><ChevronRight className="h-5 w-5 text-indigo-600" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 text-center border-b border-indigo-50 bg-indigo-50/30">
                                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
                                    <div key={d} className="py-4 text-xs font-bold text-indigo-700 uppercase tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 min-h-[700px]">
                                {renderCalendar()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
};

export default TutorPanel;
