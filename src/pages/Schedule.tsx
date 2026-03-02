import { useState, useEffect, useMemo } from "react";
import { Clock, Trash2, CheckCircle, AlertCircle, Search, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TutoringCard from "@/components/TutoringCard";

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  isTutoring?: boolean;
}

const allDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dayIndexMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hoursRange = Array.from({ length: 15 }, (_, i) => `${6 + i}:00`);


const Schedule = () => {
  const [userSchedule, setUserSchedule] = useState<ScheduleBlock[]>([]);
  const [enrolledSessions, setEnrolledSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBlock, setNewBlock] = useState({
    day: "Lunes",
    subject: "",
    startTime: "08:00",
    endTime: "09:00",
  });

  // Filtros de tutorías
  const [searchTutoring, setSearchTutoring] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [solapamientos, setSolapamientos] = useState<string[]>([]);

  // Cargar horario del localStorage
  useEffect(() => {
    const saved = localStorage.getItem("userHorario");
    if (saved) {
      try {
        setUserSchedule(JSON.parse(saved));
      } catch {
        setUserSchedule([]);
      }
    }
    fetchEnrolledSessions();
  }, []);

  const fetchEnrolledSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/auth/student/enrolled-sessions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEnrolledSessions(data);
      }
    } catch (err) {
      console.error("Error fetching enrolled sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convertir sesiones inscritas a bloques del horario
  const combinedSchedule = useMemo(() => {
    const enrollmentBlocks = enrolledSessions.map(s => {
      const dt = new Date(s.date_time);
      const day = dayIndexMap[dt.getDay()];
      const h = dt.getHours().toString().padStart(2, '0');
      const m = dt.getMinutes().toString().padStart(2, '0');
      const startTime = `${h}:${m}`;

      const endDt = new Date(dt.getTime() + s.duration * 60000);
      const eh = endDt.getHours().toString().padStart(2, '0');
      const em = endDt.getMinutes().toString().padStart(2, '0');
      const endTime = `${eh}:${em}`;

      return {
        id: `enroll-${s.id}`,
        day,
        subject: `[TUT] ${s.subject}`,
        startTime,
        endTime,
        isTutoring: true
      };
    });
    return [...userSchedule, ...enrollmentBlocks];
  }, [userSchedule, enrolledSessions]);

  // Guardar horario en localStorage
  useEffect(() => {
    localStorage.setItem("userHorario", JSON.stringify(userSchedule));
  }, [userSchedule]);

  const [realAllSessions, setRealAllSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    try {
      const response = await fetch("/auth/sessions");
      if (response.ok) {
        const data = await response.json();
        setRealAllSessions(data);
      }
    } catch (err) {
      console.error("Error fetching all sessions:", err);
    }
  };

  // Filtrar tutorías
  const filteredTutorings = useMemo(() => {
    return realAllSessions.filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(searchTutoring.toLowerCase()) ||
        t.tutor_name.toLowerCase().includes(searchTutoring.toLowerCase());

      const matchSubject = subjectFilter === "all" || t.subject === subjectFilter;
      const matchDate = !dateFilter || t.date_time.startsWith(dateFilter);

      return matchSearch && matchSubject && matchDate;
    });
  }, [searchTutoring, subjectFilter, dateFilter, realAllSessions]);

  // Filtrar tutorías inscritas
  const filteredEnrolled = useMemo(() => {
    return enrolledSessions.filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(searchTutoring.toLowerCase()) ||
        t.tutor_name.toLowerCase().includes(searchTutoring.toLowerCase());

      const matchSubject = subjectFilter === "all" || t.subject === subjectFilter;
      const matchDate = !dateFilter || t.date_time.startsWith(dateFilter);

      return matchSearch && matchSubject && matchDate;
    });
  }, [searchTutoring, subjectFilter, dateFilter, enrolledSessions]);

  // Lista de materias únicas para el filtro
  const availableSubjects = useMemo(() => {
    return [...new Set(realAllSessions.map(t => t.subject))];
  }, [realAllSessions]);

  const handleAddBlock = () => {
    if (!newBlock.subject.trim()) {
      alert("Por favor ingresa la materia");
      return;
    }
    if (newBlock.startTime >= newBlock.endTime) {
      alert("La hora de fin debe ser después de la hora de inicio");
      return;
    }

    const newStart = timeToMinutes(newBlock.startTime);
    const newEnd = timeToMinutes(newBlock.endTime);

    const haySolapamiento = combinedSchedule.some((block) => {
      if (block.day !== newBlock.day) return false;
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return !(newEnd <= blockStart || newStart >= blockEnd);
    });

    if (haySolapamiento) {
      alert(`Ya tienes una clase o tutoría en ${newBlock.day} que se solapa con este horario.`);
      return;
    }

    const block: ScheduleBlock = {
      id: Date.now().toString(),
      ...newBlock,
    };
    setUserSchedule([...userSchedule, block]);
    setNewBlock({ day: "Lunes", subject: "", startTime: "08:00", endTime: "09:00" });
  };

  const handleRemoveBlock = (id: string) => {
    if (id.startsWith('enroll-')) {
      alert("Para cancelar una inscripción usa la pestaña de 'Mis Tutorías' (próximamente)");
      return;
    }
    setUserSchedule(userSchedule.filter((b) => b.id !== id));
  };

  const checkSolapamientos = () => {
    const solapados: string[] = [];

    realAllSessions.forEach((tutoria) => {
      const dt = new Date(tutoria.date_time);
      const tDay = dayIndexMap[dt.getDay()];
      const tStartMin = dt.getHours() * 60 + dt.getMinutes();
      const tEndMin = tStartMin + tutoria.duration;

      const overlaps = userSchedule.some((block) => {
        if (block.day !== tDay) return false;
        const bStartMin = timeToMinutes(block.startTime);
        const bEndMin = timeToMinutes(block.endTime);
        return !(tEndMin <= bStartMin || tStartMin >= bEndMin);
      });

      if (overlaps) {
        solapados.push(tutoria.id);
      }
    });

    setSolapamientos(solapados);
    setTimeout(() => {
      alert(
        solapados.length > 0
          ? `${solapados.length} tutoría(s) se superponen con tu horario`
          : "¡Ninguna tutoría se superpone! Todas están disponibles"
      );
    }, 100);
  };


  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Contador de filtros activos
  const activeFiltersCount = [
    searchTutoring !== "",
    subjectFilter !== "all",
    dateFilter !== "",
  ].filter(Boolean).length;

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTutoring("");
    setSubjectFilter("all");
    setDateFilter("");
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Horario Académico</h1>
        <p className="text-muted-foreground text-lg">
          Carga tus clases y verifica qué tutorías no se solapan con tu horario
        </p>
      </div>

      {/* Formulario para agregar bloques */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-lg">Agregar clase o actividad</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Día</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newBlock.day}
                onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
              >
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Materia</label>
              <Input
                className="text-sm"
                placeholder="Ej: Cálculo I"
                value={newBlock.subject}
                onChange={(e) => setNewBlock({ ...newBlock, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Inicio</label>
              <Input
                type="time"
                className="text-sm"
                value={newBlock.startTime}
                onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fin</label>
              <Input
                type="time"
                className="text-sm"
                value={newBlock.endTime}
                onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddBlock} className="bg-blue-600 hover:bg-blue-700">
              + Agregar clase
            </Button>
            <Button onClick={checkSolapamientos} variant="outline">
              Verificar solapamientos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Horario en formato tabla/grid */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle>Vista semanal (6:00 - 20:00)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 overflow-x-auto">
          <div className="min-w-full">
            {/* Header con días */}
            <div className="flex gap-1 mb-4">
              <div className="w-20 flex-shrink-0"></div>
              {allDays.map((day) => (
                <div key={day} className="flex-1 min-w-32 text-center font-semibold text-sm text-gray-700 pb-2 border-b-2 border-blue-200">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de horas */}
            <div className="flex gap-1">
              {/* Columna de horas */}
              <div className="w-20 flex-shrink-0">
                {hoursRange.map((hour) => (
                  <div key={hour} className="h-24 flex items-start pt-1 text-xs text-gray-500 font-medium border-t border-gray-200">
                    {hour}
                  </div>
                ))}
              </div>

              {/* Columnas de días */}
              {allDays.map((day) => (
                <div key={day} className="flex-1 min-w-32 relative border-l border-gray-100">
                  {/* Background de horas */}
                  {hoursRange.map((hour) => (
                    <div
                      key={`${day}-${hour}`}
                      className="h-24 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
                    />
                  ))}

                  {/* Bloques superpuestos */}
                  {combinedSchedule
                    .filter((b) => b.day === day)
                    .map((block) => {
                      const startMin = timeToMinutes(block.startTime);
                      const endMin = timeToMinutes(block.endTime);
                      const baseMin = 6 * 60;
                      const totalMin = 14 * 60;

                      const topPercent = ((startMin - baseMin) / totalMin) * 100;
                      const heightPercent = ((endMin - startMin) / totalMin) * 100;

                      return (
                        <div
                          key={block.id}
                          className={`absolute left-1 right-1 rounded p-2 text-xs overflow-hidden shadow-md flex flex-col justify-between hover:shadow-lg transition z-10 ${block.isTutoring ? 'bg-indigo-600 text-white' : 'bg-blue-500 text-white'}`}
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            minHeight: "40px",
                          }}
                        >
                          <div>
                            <div className="font-bold text-[10px] md:text-sm line-clamp-2">{block.subject}</div>
                            <div className="text-[9px] md:text-xs opacity-90">
                              {block.startTime} - {block.endTime}
                            </div>
                          </div>
                          {!block.isTutoring && (
                            <button
                              onClick={() => handleRemoveBlock(block.id)}
                              className="text-red-300 hover:text-red-100 text-[10px] self-start mt-1"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorías con filtros */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Tutorías inscritas
          </h2>
          <Button
            variant={filtersOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>

        {/* Filtros de tutorías */}
        {filtersOpen && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Buscar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tutoría..."
                    value={searchTutoring}
                    onChange={(e) => setSearchTutoring(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Materia */}
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Fecha */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-card"
                />

                {/* Limpiar */}
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnrolled.map((t) => (
            <TutoringCard
              key={t.id}
              tutoring={{
                id: t.id,
                subject: t.subject,
                tutor: t.tutor_name,
                room: t.room || "Pendiente",
                date: new Date(t.date_time).toLocaleDateString(),
                time: new Date(t.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: `${t.duration} min`,
                spotsAvailable: 0,
                spots: 0,
                accessibility: ["Inscrito"]
              }}
              isEnrolled={true}
              onEnrollSuccess={async () => {
                await fetchEnrolledSessions();
                await fetchAllSessions();
              }}
            />
          ))}
        </div>

        {filteredEnrolled.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No se encontraron tutorías con los filtros seleccionados.
          </p>
        )}
      </div>
    </main>
  );
};

export default Schedule;
