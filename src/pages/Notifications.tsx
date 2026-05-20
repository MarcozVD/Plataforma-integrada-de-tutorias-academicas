import { useState, useEffect } from "react";
import { Bell, AlertTriangle, XCircle, Lightbulb, Clock, Inbox, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotifType = "reminder" | "change" | "cancellation" | "recommendation";

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; label: string; bg: string; text: string; border: string; dot: string }> = {
  reminder:       { icon: <Clock size={15} />,        label: "Recordatorio", bg: "bg-[#00AEEF]/10", text: "text-[#0090C5]", border: "border-[#00AEEF]/20", dot: "bg-[#00AEEF]"  },
  change:         { icon: <AlertTriangle size={15} />, label: "Cambio",       bg: "bg-[#FF9900]/10", text: "text-[#e08800]", border: "border-[#FF9900]/20", dot: "bg-[#FF9900]"  },
  cancellation:   { icon: <XCircle size={15} />,      label: "Cancelación",  bg: "bg-red-50",       text: "text-red-600",   border: "border-red-200",      dot: "bg-red-500"    },
  recommendation: { icon: <Lightbulb size={15} />,    label: "Sugerencia",   bg: "bg-[#8DC63F]/10", text: "text-[#578426]", border: "border-[#8DC63F]/20", dot: "bg-[#8DC63F]"  },
};

const FILTER_OPTIONS = [
  { value: "all",            label: "Todas"         },
  { value: "unread",         label: "No leídas"     },
  { value: "reminder",       label: "Recordatorios" },
  { value: "recommendation", label: "Sugerencias"   },
  { value: "change",         label: "Cambios"       },
  { value: "cancellation",   label: "Cancelaciones" },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds]             = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState("all");

  useEffect(() => {
    // Lógica original del compañero
    const saved = localStorage.getItem("pita_read_notifs");
    if (saved) setReadIds(JSON.parse(saved));

    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch("/auth/student/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          // Auto-marcar como leídas después de 2 segundos (lógica original)
          setTimeout(() => {
            const allIds = data.map((n: any) => n.id);
            const prev   = localStorage.getItem("pita_read_notifs");
            const newReadIds = Array.from(new Set([...(prev ? JSON.parse(prev) : []), ...allIds]));
            localStorage.setItem("pita_read_notifs", JSON.stringify(newReadIds));
            setReadIds(newReadIds as string[]);
          }, 2000);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchNotifs();
  }, []);

  const markAllRead = () => {
    const allIds     = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    localStorage.setItem("pita_read_notifs", JSON.stringify(newReadIds));
    setReadIds(newReadIds as string[]);
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === "all")    return true;
    if (activeFilter === "unread") return !readIds.includes(n.id);
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

      <section className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell size={24} className="text-[#FF9900]" /> Notificaciones
              {unreadCount > 0 && (
                <Badge className="bg-[#FF9900] text-white text-xs px-2">{unreadCount} nuevas</Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Recordatorios, cambios y recomendaciones</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 text-xs h-8 shrink-0">
              <CheckCheck size={13} /> Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="mt-4 h-1 w-24 rounded-full unab-gradient" />
      </section>

      {/* Filtros */}
      <section className="mb-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => {
            const count =
              opt.value === "all"    ? notifications.length :
              opt.value === "unread" ? notifications.filter(n => !readIds.includes(n.id)).length :
              notifications.filter(n => n.type === opt.value).length;
            if (count === 0 && opt.value !== "all") return null;
            return (
              <button key={opt.value} onClick={() => setActiveFilter(opt.value)}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === opt.value ? "bg-[#00AEEF] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground")}>
                {opt.label}
                <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold",
                  activeFilter === opt.value ? "bg-white/20 text-white" : "bg-background text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-6 w-6 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin mr-3" />
          Cargando notificaciones...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
          <Inbox size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {activeFilter === "unread" ? "¡Todo al día! No tienes notificaciones sin leer" : "No hay notificaciones en esta categoría"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const isRead = readIds.includes(n.id);
            const cfg    = TYPE_CONFIG[n.type as NotifType] ?? TYPE_CONFIG.reminder;
            return (
              <Card key={n.id} className={cn("border transition-all duration-1000",
                !isRead ? "border-[#00AEEF]/25 bg-[#00AEEF]/4" : "border-border/50 bg-card opacity-80 hover:opacity-100")}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", cfg.bg, cfg.text, cfg.border)}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className={cn("text-sm font-semibold", isRead ? "text-muted-foreground" : "text-foreground")}>{n.title}</h3>
                      <span className={cn("rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide border", cfg.bg, cfg.text, cfg.border)}>
                        {cfg.label}
                      </span>
                      {!isRead && <Badge className="h-4 px-1.5 text-[9px] bg-[#FF9900] text-white ml-auto animate-pulse">Nuevo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1"><Clock size={10} /> {n.time}</p>
                  </div>
                  {!isRead && <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", cfg.dot)} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          Mostrando {filtered.length} de {notifications.length} notificaciones
        </p>
      )}
    </main>
  );
};

export default Notifications;