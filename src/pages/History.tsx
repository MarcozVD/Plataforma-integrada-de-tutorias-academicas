import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, User, Star, Sparkles, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import RecommendationCard from "@/components/RecommendationCard";
import { useToast } from "@/components/ui/use-toast";

const History = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [availableTutorings, setAvailableTutorings] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchSessions(), fetchTutorings(), fetchRooms()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/auth/student/enrolled-sessions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchTutorings = async () => {
    try {
      const res = await fetch("/auth/sessions");
      if (res.ok) setAvailableTutorings(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("/auth/rooms");
      if (res.ok) setAllRooms(await res.json());
    } catch (err) { console.error(err); }
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

  // Calcula reportes basados en la actividad
  const insights = useMemo(() => {
    const pastSessions = sessions.filter(s => isPast(s.date_time));
    
    // Top Subject
    const subjectCounts = sessions.reduce((acc: any, s: any) => {
        acc[s.subject] = (acc[s.subject] || 0) + 1;
        return acc;
    }, {});
    const topSubject = Object.keys(subjectCounts).sort((a, b) => subjectCounts[b] - subjectCounts[a])[0];

    // Recommendation
    const recommendedSession = availableTutorings.find(t => 
        t.subject === topSubject && 
        new Date(t.date_time) > new Date() &&
        !sessions.some(s => s.id === t.id)
    );

    // Top Rooms
    const roomCounts = pastSessions.reduce((acc: any, s: any) => {
        if (s.room) acc[s.room] = (acc[s.room] || 0) + 1;
        return acc;
    }, {});
    
    const sortedRooms = Object.entries(roomCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 6)
        .map(([roomName, count]) => {
            const roomData = allRooms.find(r => r.name === roomName) || { building: 'Campus' };
            return { id: roomName, name: roomName, building: roomData.building, visits: count as number };
        });

    return { topSubject, recommendedSession, sortedRooms };
  }, [sessions, availableTutorings, allRooms]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <h1 className="text-3xl font-bold mb-1">Mis Tutorías</h1>
      <p className="text-muted-foreground mb-8 text-lg">Historial y gestión de tus inscripciones académicas</p>

      {/* Recommendations */}
      {!loading && sessions.length > 0 && (
        <section className="mb-10" aria-labelledby="hist-recs">
          <h2 id="hist-recs" className="text-xl font-semibold flex items-center gap-2 mb-4 text-indigo-900">
            <Sparkles className="h-6 w-6 text-indigo-600" /> Basado en tu actividad
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.recommendedSession ? (
              <RecommendationCard 
                title={`Nueva tutoría de ${insights.topSubject}`} 
                reason={`Hay cupos el ${new Date(insights.recommendedSession.date_time).toLocaleDateString()} a las ${new Date(insights.recommendedSession.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
              />
            ) : (
              <RecommendationCard 
                title={insights.topSubject ? `Sueles asistir a ${insights.topSubject}` : "Explora nuevas tutorías"} 
                reason="No hay nuevas sesiones programadas por ahora." 
              />
            )}
            
            {insights.sortedRooms.length > 0 ? (
              <RecommendationCard 
                title={`${insights.sortedRooms[0].name} es tu favorito`} 
                reason={`Es el salón que más has visitado este semestre (${insights.sortedRooms[0].visits} veces).`} 
              />
            ) : (
              <RecommendationCard title="Tu historial de salones" reason="Pronto identificaremos tus lugares de estudio favoritos." />
            )}
            
            <RecommendationCard 
              title={`Has asistido a ${sessions.filter(s => isPast(s.date_time)).length} sesiones`} 
              reason="¡Sigue así manteniendo tu ritmo de estudio y mejorando tus notas!" 
            />
          </div>
        </section>
      )}

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
              <Button onClick={() => window.location.href = "/"} variant="outline">Explorar tutorías disponibles</Button>
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
          {loading ? (
             <div className="flex flex-col items-center py-20 text-muted-foreground">
               <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
               <p>Cargando información...</p>
             </div>
          ) : insights.sortedRooms.length === 0 ? (
             <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
               <p className="text-muted-foreground">Todavía no tienes un historial de salones visitados.</p>
             </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.sortedRooms.map((r: any) => (
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
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {r.visits} visita{r.visits !== 1 && 's'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default History;
