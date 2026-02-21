import { Calendar, Clock, MapPin, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tutoring } from "@/data/mockData";

const TutoringCard = ({ tutoring }: { tutoring: Tutoring }) => {
  const spotsRatio = tutoring.spotsAvailable / tutoring.spots;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-foreground">{tutoring.subject}</h3>
          <Badge className={spotsRatio <= 0.2 ? "bg-destructive text-destructive-foreground" : spotsRatio <= 0.5 ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>
            {tutoring.spotsAvailable} cupos
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
          <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {tutoring.tutor}</p>
          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {tutoring.room}</p>
          <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {tutoring.date}</p>
          <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {tutoring.time} ({tutoring.duration})</p>
        </div>

        {tutoring.accessibility.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tutoring.accessibility.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
            ))}
          </div>
        )}

        <Button className="w-full" size="sm">Inscribirme</Button>
      </CardContent>
    </Card>
  );
};

export default TutoringCard;
