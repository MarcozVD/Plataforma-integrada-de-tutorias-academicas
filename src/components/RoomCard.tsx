import { MapPin, Users, Accessibility, Eye, Ear, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@/data/mockData";

const RoomCard = ({ room }: { room: any }) => {
  // Normalize fields between mock and API
  const isWebAPI = room.accessibility_wheelchair !== undefined;
  const hasWheelchair = isWebAPI ? room.accessibility_wheelchair : room.accessibility?.wheelchair;
  const hasVisual = isWebAPI ? room.accessibility_visual : room.accessibility?.visualSupport;
  const hasHearing = isWebAPI ? room.accessibility_hearing : room.accessibility?.hearingSupport;

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-indigo-900">{room.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {room.building}{room.floor ? `, ${room.floor}` : ""}
            </p>
          </div>
          <Badge variant={room.available ? "default" : "secondary"} className={room.available ? "bg-emerald-500 text-white" : ""}>
            {room.available ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Disponible</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Ocupado</>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 font-medium">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacity} personas</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {hasWheelchair && (
            <Badge variant="outline" className="text-[10px] h-5 border-blue-100 bg-blue-50 text-blue-700"><Accessibility className="h-3 w-3 mr-1" /> Silla de ruedas</Badge>
          )}
          {hasVisual && (
            <Badge variant="outline" className="text-[10px] h-5 border-emerald-100 bg-emerald-50 text-emerald-700"><Eye className="h-3 w-3 mr-1" /> Apoyo visual</Badge>
          )}
          {hasHearing && (
            <Badge variant="outline" className="text-[10px] h-5 border-amber-100 bg-amber-50 text-amber-700"><Ear className="h-3 w-3 mr-1" /> Apoyo auditivo</Badge>
          )}
        </div>

        {/* --- Availability Hours --- */}
        {room.availabilities && room.availabilities.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5 leading-none">
              <Calendar className="h-3 w-3" /> Horarios Libres
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {room.availabilities.map((av: any, idx: number) => (
                <div key={idx} className="text-[10px] bg-indigo-50/50 border border-indigo-100/50 p-2 rounded-lg flex items-center justify-between group/hour hover:bg-white transition-colors">
                  <span className="font-bold text-indigo-900">
                    {av.day ? av.day : new Date(av.specific_date + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-medium border-indigo-100 text-indigo-700 bg-white">
                    {av.start_time} - {av.end_time}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.currentTutoring && (
          <p className="mt-3 text-sm text-indigo-600 font-bold bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            📚 Tutoría activa: {room.currentTutoring}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
