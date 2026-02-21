import { Bell, AlertTriangle, XCircle, Lightbulb, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/data/mockData";

const iconMap = {
  reminder: <Clock className="h-4 w-4" />,
  change: <AlertTriangle className="h-4 w-4" />,
  cancellation: <XCircle className="h-4 w-4" />,
  recommendation: <Lightbulb className="h-4 w-4" />,
};

const colorMap = {
  reminder: "bg-primary/10 text-primary",
  change: "bg-warning/10 text-warning",
  cancellation: "bg-destructive/10 text-destructive",
  recommendation: "bg-success/10 text-success",
};

const Notifications = () => (
  <main className="container mx-auto px-4 py-6 max-w-4xl">
    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
      <Bell className="h-6 w-6" /> Notificaciones
    </h1>
    <p className="text-muted-foreground mb-6">Recordatorios, cambios y recomendaciones</p>

    <div className="space-y-3">
      {notifications.map((n) => (
        <Card key={n.id} className={!n.read ? "border-primary/30 bg-primary/5" : ""}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className={`rounded-full p-2 shrink-0 ${colorMap[n.type]}`}>
              {iconMap[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-sm">{n.title}</h3>
                {!n.read && <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">Nuevo</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </main>
);

export default Notifications;
