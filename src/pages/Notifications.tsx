import { Bell, AlertTriangle, XCircle, Lightbulb, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

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

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('pita_read_notifs');
    if (saved) setReadIds(JSON.parse(saved));

    const fetchNotifs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/auth/student/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                
                // Marcar todas como leídas después de 2 segundos de visualizarlas
                setTimeout(() => {
                    const allIds = data.map((n: any) => n.id);
                    const newReadIds = Array.from(new Set([...(saved ? JSON.parse(saved) : []), ...allIds]));
                    localStorage.setItem('pita_read_notifs', JSON.stringify(newReadIds));
                    setReadIds(newReadIds as string[]);
                }, 2000);
            }
        } catch(err) { console.error(err); } finally { setLoading(false); }
    };
    fetchNotifs();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Bell className="h-6 w-6" /> Notificaciones
      </h1>
      <p className="text-muted-foreground mb-6">Recordatorios, cambios y recomendaciones</p>

      {loading ? (
          <p className="text-muted-foreground text-center py-10">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
             <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
             <p className="text-muted-foreground">No tienes notificaciones por el momento.</p>
          </div>
      ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <Card key={n.id} className={!isRead ? "border-primary/30 bg-primary/5 transition-all duration-1000" : "transition-all duration-1000"}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`rounded-full p-2 shrink-0 ${colorMap[n.type as keyof typeof colorMap]}`}>
                      {iconMap[n.type as keyof typeof iconMap]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-sm">{n.title}</h3>
                        {!isRead && <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 animate-pulse">Nuevo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
      )}
    </main>
  );
};

export default Notifications;
