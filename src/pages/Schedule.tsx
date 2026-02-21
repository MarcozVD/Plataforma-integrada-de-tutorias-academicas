import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecommendationCard from "@/components/RecommendationCard";
import { schedule } from "@/data/mockData";

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const typeStyles: Record<string, string> = {
  class: "bg-primary/10 border-primary/30 text-foreground",
  free: "bg-success/10 border-success/30 text-success",
  tutoring: "bg-warning/10 border-warning/30 text-foreground",
};

const typeLabels: Record<string, string> = {
  class: "Clase",
  free: "Libre",
  tutoring: "Tutoría",
};

const Schedule = () => {
  const freeBlocks = schedule.filter((b) => b.type === "free");

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Mi Horario</h1>
      <p className="text-muted-foreground mb-6">Gestiona tu horario y encuentra horas libres para tutorías</p>

      {/* Free time alerts */}
      {freeBlocks.length > 0 && (
        <section className="mb-6" aria-label="Alertas de horas libres">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-warning" /> Horas libres disponibles
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {freeBlocks.map((b) => (
              <RecommendationCard
                key={b.id}
                icon={<Clock className="h-4 w-4 text-primary" />}
                title={`${b.day} ${b.startTime} - ${b.endTime}`}
                reason="Tienes una hora libre, hay tutorías disponibles"
                actionLabel="Ver tutorías"
              />
            ))}
          </div>
        </section>
      )}

      {/* Schedule grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => {
          const blocks = schedule.filter((b) => b.day === day);
          return (
            <Card key={day}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">{day}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {blocks.length === 0 && <p className="text-xs text-muted-foreground">Sin actividades</p>}
                {blocks.map((b) => (
                  <div key={b.id} className={`rounded-md border p-2.5 text-xs ${typeStyles[b.type]}`}>
                    <div className="font-medium">{b.startTime} - {b.endTime}</div>
                    <div className="mt-0.5">{b.subject || "Hora libre"}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{typeLabels[b.type]}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
};

export default Schedule;
