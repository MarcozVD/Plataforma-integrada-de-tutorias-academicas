import { MapPin, Users, Accessibility, Eye, Ear, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: any;
  listView?: boolean;
}

const RoomCard = ({ room, listView = false }: RoomCardProps) => {
  const hasWheelchair = room.has_wheelchair_access;
  const hasVisual     = room.has_visual_support;
  const hasHearing    = room.has_hearing_support;
  const isAvailable   = room.available;

  // ── Vista Lista ──────────────────────────────────────────────────────────
  if (listView) {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
        isAvailable
          ? "border-border/60 bg-card hover:border-[#8DC63F]/40 hover:bg-[#8DC63F]/5"
          : "border-border/40 bg-muted/30"
      )}>
        <div className={cn("h-9 w-1 rounded-full shrink-0", isAvailable ? "bg-[#8DC63F]" : "bg-red-400")} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{room.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {room.building}{room.floor ? `, ${room.floor}` : ""}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {hasWheelchair && <div title="Silla de ruedas" className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00AEEF]/10"><Accessibility size={12} className="text-[#0090C5]" /></div>}
          {hasVisual     && <div title="Apoyo visual"    className="flex h-6 w-6 items-center justify-center rounded-md bg-[#8DC63F]/10"><Eye size={12} className="text-[#578426]" /></div>}
          {hasHearing    && <div title="Apoyo auditivo"  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF9900]/10"><Ear size={12} className="text-[#e08800]" /></div>}
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users size={12} /> {room.capacity} cap.
        </div>
        <Badge className={cn("shrink-0 gap-1 text-[10px] font-medium",
          isAvailable
            ? "bg-[#8DC63F]/15 text-[#578426] border border-[#8DC63F]/30 hover:bg-[#8DC63F]/20"
            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        )}>
          {isAvailable
            ? <><CheckCircle2 size={10} /> Disponible</>
            : <><XCircle size={10} /> Ocupada</>}
        </Badge>
      </div>
    );
  }

  // ── Vista Grid ───────────────────────────────────────────────────────────
  return (
    <Card role="article" aria-label={`Salón ${room.name}, ${isAvailable ? "disponible" : "ocupado"}`} className={cn(
      "overflow-hidden transition-all hover:shadow-md group",
      isAvailable ? "border-border/60 hover:border-[#8DC63F]/40" : "border-border/40 bg-muted/20"
    )}>
      {/* Barra superior de estado */}
      <div className={cn("h-1 w-full", isAvailable ? "bg-[#8DC63F]" : "bg-red-400")} />

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate">{room.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {room.building}{room.floor ? `, ${room.floor}` : ""}
            </p>
          </div>
          <Badge className={cn("shrink-0 gap-1 text-[10px] font-medium",
            isAvailable
              ? "bg-[#8DC63F]/15 text-[#578426] border border-[#8DC63F]/30"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {isAvailable
              ? <><CheckCircle2 size={10} /> Disponible</>
              : <><XCircle size={10} /> Ocupada</>}
          </Badge>
        </div>

        {/* Capacidad */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Users size={13} /> <span>{room.capacity} personas</span>
        </div>

        {/* Accesibilidad */}
        {(hasWheelchair || hasVisual || hasHearing) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hasWheelchair && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-[#00AEEF]/8 border-[#00AEEF]/25 text-[#0090C5]">
                <Accessibility size={10} /> Silla de ruedas
              </Badge>
            )}
            {hasVisual && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-[#8DC63F]/8 border-[#8DC63F]/25 text-[#578426]">
                <Eye size={10} /> Apoyo visual
              </Badge>
            )}
            {hasHearing && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-[#FF9900]/8 border-[#FF9900]/25 text-[#e08800]">
                <Ear size={10} /> Apoyo auditivo
              </Badge>
            )}
          </div>
        )}

        {/* Horarios libres */}
        {room.availabilities && room.availabilities.length > 0 && (
          <div className="pt-3 border-t border-border/40 space-y-2">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1">
              <Calendar size={10} /> Horarios libres
            </p>
            <div className="space-y-1">
              {room.availabilities.map((av: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-[10px] bg-[#00AEEF]/5 border border-[#00AEEF]/15 px-2.5 py-1.5 rounded-lg">
                  <span className="font-semibold text-foreground">
                    {av.day
                      ? av.day
                      : new Date(av.specific_date + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex items-center gap-1 text-[#0090C5] font-medium">
                    <Clock size={9} /> {av.start_time} - {av.end_time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutoría activa */}
        {room.currentTutoring && (
          <div className="mt-3 flex items-center gap-2 bg-[#FF9900]/8 border border-[#FF9900]/25 px-3 py-2 rounded-lg">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF9900] animate-pulse shrink-0" />
            <p className="text-xs text-[#e08800] font-medium truncate">
              En uso: {room.currentTutoring}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;