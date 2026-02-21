import { MapPin, Users, Accessibility, Eye, Ear, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@/data/mockData";

const RoomCard = ({ room }: { room: Room }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{room.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {room.building}, {room.floor}
          </p>
        </div>
        <Badge variant={room.available ? "default" : "secondary"} className={room.available ? "bg-success text-success-foreground" : ""}>
          {room.available ? (
            <><CheckCircle2 className="h-3 w-3 mr-1" /> Disponible</>
          ) : (
            <><XCircle className="h-3 w-3 mr-1" /> Ocupado</>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacity} personas</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {room.accessibility.wheelchair && (
          <Badge variant="outline" className="text-xs"><Accessibility className="h-3 w-3 mr-1" /> Silla de ruedas</Badge>
        )}
        {room.accessibility.visualSupport && (
          <Badge variant="outline" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Apoyo visual</Badge>
        )}
        {room.accessibility.hearingSupport && (
          <Badge variant="outline" className="text-xs"><Ear className="h-3 w-3 mr-1" /> Apoyo auditivo</Badge>
        )}
      </div>

      {room.currentTutoring && (
        <p className="mt-3 text-sm text-primary font-medium">
          📚 Tutoría activa: {room.currentTutoring}
        </p>
      )}
    </CardContent>
  </Card>
);

export default RoomCard;
