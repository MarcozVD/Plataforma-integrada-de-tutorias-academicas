import { Calendar, Clock, MapPin, User, Users, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface TutoringProps {
  tutoring: {
    id: number;
    subject: string;
    tutor: string;
    room: string;
    date: string;
    time: string;
    duration: string;
    spotsAvailable: number;
    spots: number;
    accessibility: string[];
  };
  isEnrolled?: boolean;
  onEnrollSuccess?: () => void;
}

const TutoringCard = ({ tutoring, isEnrolled, onEnrollSuccess }: TutoringProps) => {
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();
  const spotsRatio = tutoring.spotsAvailable / tutoring.spots;
  const userType = localStorage.getItem("userType");

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/auth/sessions/${tutoring.id}/enroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "¡Inscripción exitosa!",
          description: `Te has inscrito en la tutoría de ${tutoring.subject}`,
        });
        if (onEnrollSuccess) onEnrollSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.detail || "No se pudo completar la inscripción",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "Inténtalo de nuevo más tarde",
      });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden border-2 hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-xl text-indigo-900 leading-tight">{tutoring.subject}</h3>
            <p className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium">
              <User className="h-4 w-4" /> {tutoring.tutor}
            </p>
          </div>
          <Badge className={`px-2 py-1 ${spotsRatio <= 0.2 ? "bg-red-100 text-red-700 border-red-200" : spotsRatio <= 0.5 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`} variant="outline">
            {tutoring.spotsAvailable} cupos
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="truncate">{tutoring.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span className="truncate">{tutoring.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg col-span-2">
            <MapPin className="h-4 w-4 text-indigo-500" />
            <span className="truncate">{tutoring.room}</span>
          </div>
        </div>

        {tutoring.accessibility.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tutoring.accessibility.map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-600 border-indigo-100">
                {a}
              </Badge>
            ))}
          </div>
        )}

        <Button
          className={`w-full h-11 text-md font-semibold transition-all group-hover:shadow-lg active:scale-[0.98] ${isEnrolled ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""}`}
          onClick={handleEnroll}
          disabled={enrolling || tutoring.spotsAvailable === 0 || isEnrolled || userType === "tutor"}
          variant={isEnrolled ? "outline" : "default"}
        >
          {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {userType === "tutor" ? (
            "Tu Sesión Programada"
          ) : isEnrolled ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> Ya estás inscrito
            </span>
          ) : tutoring.spotsAvailable === 0 ? (
            "Sin cupos"
          ) : (
            "Inscribirme ahora"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TutoringCard;
