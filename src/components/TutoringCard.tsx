import { Calendar, Clock, MapPin, User, Loader2, CheckCircle2, Clock3 } from "lucide-react";
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
  isWaitlisted?: boolean;
  onEnrollSuccess?: () => void;
}

const TutoringCard = ({ tutoring, isEnrolled, isWaitlisted, onEnrollSuccess }: TutoringProps) => {
  const [enrolling, setEnrolling] = useState(false);
  const [waitlisting, setWaitlisting] = useState(false);
  const { toast } = useToast();

  const userType   = localStorage.getItem("userType");
  const spotsRatio = tutoring.spots > 0 ? tutoring.spotsAvailable / tutoring.spots : 1;
  const isFull     = tutoring.spotsAvailable === 0;
  const isTutor    = userType === "tutor";

  const spotsBadgeClass =
    isFull            ? "bg-red-50 text-red-700 border-red-200"           :
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

  const handleWaitlist = async () => {
    setWaitlisting(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/auth/sessions/${tutoring.id}/waitlist`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "En lista de espera", description: `Eres el #${data.position} en la lista. Te notificaremos si se libera un cupo.` });
        onEnrollSuccess?.();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.detail || "No se pudo unir a la lista de espera" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión", description: "Inténtalo de nuevo más tarde" });
    } finally {
      setWaitlisting(false);
    }
  };

  const topBarColor = isEnrolled ? "bg-[#8DC63F]" : isWaitlisted ? "bg-amber-400" : isFull ? "bg-red-400" : "bg-[#00AEEF]";

  return (
    <Card role="article" aria-label={`Tutoría de ${tutoring.subject} con ${tutoring.tutor}`} className={cn(
      "overflow-hidden transition-all hover:shadow-md group",
      isEnrolled   ? "border-[#8DC63F]/40 hover:border-[#8DC63F]/60"  :
      isWaitlisted ? "border-amber-300/50 bg-amber-50/30"              :
      isFull       ? "border-border/40 bg-muted/10"                    :
                     "border-border/60 hover:border-[#00AEEF]/30"
    )}>
      <div className={cn("h-1 w-full", topBarColor)} />

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
          ) : isWaitlisted ? (
            <Badge variant="outline" className="shrink-0 text-[11px] gap-1 bg-amber-50 text-amber-700 border-amber-200">
              <Clock3 size={10} /> En espera
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
        {!isEnrolled && !isWaitlisted && tutoring.accessibility.length > 0 && (
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
        {!isEnrolled && !isWaitlisted && tutoring.spots > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Cupos</span>
              <span>{tutoring.spotsAvailable}/{tutoring.spots}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all",
                isFull            ? "bg-red-400"    :
                spotsRatio <= 0.2 ? "bg-orange-400" :
                spotsRatio <= 0.5 ? "bg-yellow-400" :
                                    "bg-[#8DC63F]"
              )} style={{ width: `${spotsRatio * 100}%` }} />
            </div>
          </div>
        )}

        {/* Botón */}
        {isTutor ? (
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-muted text-muted-foreground">
            Tu sesión programada
          </Button>
        ) : isEnrolled ? (
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-[#8DC63F]/10 text-[#578426] border border-[#8DC63F]/40">
            <CheckCircle2 size={14} /> Ya estás inscrito
          </Button>
        ) : isWaitlisted ? (
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 size={14} /> En lista de espera
          </Button>
        ) : isFull ? (
          <Button
            variant="ghost"
            className="w-full h-9 text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
            onClick={handleWaitlist}
            disabled={waitlisting}
          >
            {waitlisting ? <><Loader2 size={14} className="animate-spin" /> Procesando...</> : <><Clock3 size={14} /> Unirme a lista de espera</>}
          </Button>
        ) : (
          <Button
            className="w-full h-9 text-sm font-semibold bg-[#00AEEF] hover:bg-[#0090C5] text-white gap-2"
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? <><Loader2 size={14} className="animate-spin" /> Inscribiendo...</> : "Inscribirme ahora"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TutoringCard;