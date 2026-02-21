import { Calendar, MapPin, User, Star, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecommendationCard from "@/components/RecommendationCard";

const pastTutorings = [
  { id: "1", subject: "Cálculo I", tutor: "María García", room: "Aula 201", date: "2026-02-18", time: "10:00" },
  { id: "2", subject: "Programación II", tutor: "Carlos López", room: "Lab 102", date: "2026-02-15", time: "14:00" },
  { id: "3", subject: "Cálculo I", tutor: "María García", room: "Aula 201", date: "2026-02-11", time: "10:00" },
  { id: "4", subject: "Álgebra Lineal", tutor: "Ana Martínez", room: "Aula 305", date: "2026-02-08", time: "09:00" },
];

const pastRooms = [
  { id: "1", name: "Aula 201", building: "Edificio A", visits: 5 },
  { id: "2", name: "Lab 102", building: "Edificio C", visits: 3 },
  { id: "3", name: "Aula 305", building: "Edificio B", visits: 2 },
];

const History = () => (
  <main className="container mx-auto px-4 py-6 max-w-6xl">
    <h1 className="text-2xl font-bold mb-1">Mis Tutorías</h1>
    <p className="text-muted-foreground mb-6">Historial y recomendaciones basadas en tu actividad</p>

    {/* Recommendations */}
    <section className="mb-8" aria-labelledby="hist-recs">
      <h2 id="hist-recs" className="text-lg font-semibold flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" /> Basado en tu historial
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <RecommendationCard title="Repetir tutoría de Cálculo I" reason="Has asistido 3 veces con María García" />
        <RecommendationCard title="Aula 201 disponible mañana" reason="Es el salón que más visitas (5 veces)" />
        <RecommendationCard title="Nueva tutoría de Álgebra" reason="Es una de tus materias más consultadas" />
      </div>
    </section>

    <Tabs defaultValue="tutorings">
      <TabsList className="mb-4">
        <TabsTrigger value="tutorings">Tutorías pasadas</TabsTrigger>
        <TabsTrigger value="rooms">Salones visitados</TabsTrigger>
      </TabsList>

      <TabsContent value="tutorings">
        <div className="space-y-3">
          {pastTutorings.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{t.subject}</h3>
                  <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                    <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {t.tutor}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.room}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {t.date} · {t.time}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="rooms">
        <div className="space-y-3">
          {pastRooms.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.building}</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" /> {r.visits} visitas
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </main>
);

export default History;
