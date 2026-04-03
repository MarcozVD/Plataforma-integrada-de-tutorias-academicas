import { Calendar, Clock, MapPin, User, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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

  // Lógica original preservada — lee de localStorage
  const userType  = localStorage.getItem("userType");
  const spotsRatio = tutoring.spots > 0 ? tutoring.spotsAvailable / tutoring.spots : 1;
  const isFull    = tutoring.spotsAvailable === 0;
  const isTutor   = userType === "tutor";

  const spotsBadgeClass =
    isFull           ? "bg-red-50 text-red-700 border-red-200"            :
    spotsRatio <= 0.2 ? "bg-orange-50 text-orange-700 border-orange-200"  :
    spotsRatio <= 0.5 ? "bg-yellow-50 text-yellow-700 border-yellow-200"  :
                        "bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30";

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/auth/sessions/${tutoring.id}/enroll`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "¡Inscripción exitosa!", description: `Te has inscrito en la tutoría de ${tutoring.subject}` });
        onEnrollSuccess?.();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.detail || "No se pudo completar la inscripción" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión", description: "Inténtalo de nuevo más tarde" });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md group",
      isEnrolled  ? "border-[#8DC63F]/40 hover:border-[#8DC63F]/60" :
      isFull      ? "border-border/40 bg-muted/10"                   :
                    "border-border/60 hover:border-[#00AEEF]/30"
    )}>
      {/* Barra superior */}
      <div className={cn("h-1 w-full",
        isEnrolled ? "bg-[#8DC63F]" : isFull ? "bg-red-400" : "bg-[#00AEEF]"
      )} />

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground leading-tight truncate">
              {tutoring.subject}
            </h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <User size={12} className="text-[#00AEEF] shrink-0" />
              <span className="truncate">{tutoring.tutor}</span>
            </p>
          </div>
          {isEnrolled ? (
            <Badge variant="outline" className="shrink-0 text-[11px] gap-1 bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30">
              <CheckCircle2 size={10} /> Inscrito
            </Badge>
          ) : (
            <Badge variant="outline" className={cn("shrink-0 text-[11px] font-semibold", spotsBadgeClass)}>
              {isFull ? "Sin cupos" : `${tutoring.spotsAvailable} cupos`}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
            <Calendar size={11} className="text-[#00AEEF] shrink-0" />
            <span className="truncate">{tutoring.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
            <Clock size={11} className="text-[#00AEEF] shrink-0" />
            <span>{tutoring.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg col-span-2">
            <MapPin size={11} className="text-[#00AEEF] shrink-0" />
            <span className="truncate">{tutoring.room}</span>
          </div>
        </div>

        {/* Accesibilidad */}
        {tutoring.accessibility.length > 0 && tutoring.accessibility[0] !== "Inscrito" && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tutoring.accessibility.map((a) => (
              <Badge key={a} variant="outline"
                className="text-[9px] h-4 px-1.5 uppercase tracking-wide font-semibold bg-[#00AEEF]/8 border-[#00AEEF]/20 text-[#0090C5]">
                {a}
              </Badge>
            ))}
          </div>
        )}

        {/* Barra de cupos */}
        {!isEnrolled && tutoring.spots > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Cupos</span>
              <span>{tutoring.spotsAvailable}/{tutoring.spots}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all",
                isFull           ? "bg-red-400"    :
                spotsRatio <= 0.2 ? "bg-orange-400" :
                spotsRatio <= 0.5 ? "bg-yellow-400" :
                                    "bg-[#8DC63F]"
              )} style={{ width: `${spotsRatio * 100}%` }} />
            </div>
          </div>
        )}

        {/* Botón */}
        <Button
          className={cn(
            "w-full h-9 text-sm font-semibold transition-all gap-2",
            isEnrolled
              ? "bg-[#8DC63F]/10 text-[#578426] border border-[#8DC63F]/40 hover:bg-[#8DC63F]/20"
              : isTutor
              ? "bg-muted text-muted-foreground cursor-default"
              : isFull
              ? "bg-red-50 text-red-500 border border-red-200 cursor-not-allowed"
              : "bg-[#00AEEF] hover:bg-[#0090C5] text-white"
          )}
          onClick={!isEnrolled && !isTutor && !isFull ? handleEnroll : undefined}
          disabled={enrolling || isFull || isEnrolled || isTutor}
          variant="ghost"
        >
          {enrolling ? (
            <><Loader2 size={14} className="animate-spin" /> Inscribiendo...</>
          ) : isTutor ? (
            "Tu sesión programada"
          ) : isEnrolled ? (
            <><CheckCircle2 size={14} /> Ya estás inscrito</>
          ) : isFull ? (
            <><XCircle size={14} /> Sin cupos disponibles</>
          ) : (
            "Inscribirme ahora"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TutoringCard;