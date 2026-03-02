import { useState, useEffect } from "react";
import { Calendar, MapPin, User, Star, Sparkles, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import RecommendationCard from "@/components/RecommendationCard";
import { useToast } from "@/components/ui/use-toast";

const pastRooms = [
  { id: "1", name: "Aula 201", building: "Edificio A", visits: 5 },
  { id: "2", name: "Lab 102", building: "Edificio C", visits: 3 },
  { id: "3", name: "Aula 305", building: "Edificio B", visits: 2 },
];

const History = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/auth/student/enrolled-sessions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta tutoría? El cupo quedará disponible para otro estudiante.")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/auth/sessions/${sessionId}/enroll`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        toast({ title: "Tutoría cancelada", description: "Se ha liberado tu cupo exitosamente." });
        fetchSessions();
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cancelar la tutoría." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error de conexión" });
    }
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <h1 className="text-3xl font-bold mb-1">Mis Tutorías</h1>
      <p className="text-muted-foreground mb-8 text-lg">Historial y gestión de tus inscripciones académicas</p>

      {/* Recommendations */}
      <section className="mb-10" aria-labelledby="hist-recs">
        <h2 id="hist-recs" className="text-xl font-semibold flex items-center gap-2 mb-4 text-indigo-900">
          <Sparkles className="h-6 w-6 text-indigo-600" /> Basado en tu actividad
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <RecommendationCard title="Repetir tutoría de Cálculo I" reason="Sueles asistir a sesiones de esta materia" />
          <RecommendationCard title="Aula 201 disponible mañana" reason="Es el salón que más has visitado este semestre" />
          <RecommendationCard title="Nueva tutoría de Álgebra" reason="Hay cupos disponibles para mañana en la tarde" />
        </div>
      </section>

      <Tabs defaultValue="tutorings" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="tutorings" className="px-6">Mi Actividad</TabsTrigger>
          <TabsTrigger value="rooms" className="px-6">Salones Habituales</TabsTrigger>
        </TabsList>

        <TabsContent value="tutorings">
          {loading ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
              <p>Cargando tus tutorías...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <p className="text-muted-foreground mb-4">Aún no te has inscrito en ninguna tutoría.</p>
              <Button onClick={() => window.location.href = "/index"} variant="outline">Explorar tutorías disponibles</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((t) => {
                const past = isPast(t.date_time);
                const dt = new Date(t.date_time);
                return (
                  <Card key={t.id} className={`group transition-all ${past ? 'opacity-70 grayscale-[0.3]' : 'hover:border-indigo-200 hover:shadow-md'}`}>
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-xl ${past ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-indigo-900">{t.subject}</h3>
                            {past ? (
                              <Badge variant="secondary" className="text-[10px] uppercase">Finalizada</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] uppercase">Próxima</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                            <p className="flex items-center gap-1.5 font-medium text-emerald-700"><User className="h-4 w-4" /> {t.tutor_name}</p>
                            <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {t.room || "Aula por confirmar"}</p>
                            <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {dt.toLocaleDateString()}</p>
                            <p className="flex items-center gap-1.5 font-bold text-indigo-900"><Star className="h-4 w-4 text-amber-500" /> {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>

                      {!past && (
                        <Button
                          variant="ghost"
                          onClick={() => handleCancel(t.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 shrink-0 self-start sm:self-center"
                        >
                          <XCircle className="h-4 w-4" /> Cancelar Inscripción
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastRooms.map((r) => (
              <Card key={r.id} className="hover:border-indigo-100 transition-colors">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900">{r.name}</h3>
                      <p className="text-sm text-muted-foreground">{r.building}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="h-7 px-3 flex items-center gap-1 bg-white border">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {r.visits} visitas
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default History;
