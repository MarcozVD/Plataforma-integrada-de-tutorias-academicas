/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: TutoringCard - Tarjeta de sesión de tutoría
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Muestra información de una sesión de tutoría académica.
 *   Permite al estudiante inscribirse o unirse a lista de espera.
 *   Se adapta según el rol y estado de inscripción del usuario.
 * 
 * FLUJO:
 *   1. Recibe datos de la tutoría, estado de inscripción y callbacks
 *   2. Calcula disponibilidad de cupos y aplica estilos visuales
 *   3. Muestra información: materia, tutor, fecha, hora, salón
 *   4. Renderiza botón apropiado según estado:
 *      - Tutor: "Tu sesión programada" (deshabilitado)
 *      - Inscrito: "Ya estás inscrito" (deshabilitado)
 *      - En espera: "En lista de espera" (deshabilitado)
 *      - Sin cupos: "Unirme a lista de espera" (acción)
 *      - Con cupos: "Inscribirme ahora" (acción)
 * 
 * ESTADOS VISUALES:
 *   - Inscrito: borde verde, barra verde
 *   - En espera: borde ámbar, barra ámbar
 *   - Sin cupos: borde gris, barra roja
 *   - Disponible: borde neutro, barra azul
 */

import { Calendar, Clock, MapPin, User, Loader2, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

/**
 * INTERFAZ: TutoringProps
 * 
 * Define las propiedades del componente:
 * - tutoring: Objeto con datos de la sesión de tutoría
 * - isEnrolled: Si el usuario ya está inscrito en esta tutoría
 * - isWaitlisted: Si el usuario está en la lista de espera
 * - onEnrollSuccess: Callback cuando la inscripción/lista de espera es exitosa
 */
interface TutoringProps {
  tutoring: {
    id: number;              // ID de la sesión
    subject: string;         // Materia (ej: "Cálculo I")
    tutor: string;           // Nombre del tutor
    room: string;            // Nombre del salón
    date: string;            // Fecha de la sesión
    time: string;            // Hora de la sesión
    duration: string;        // Duración (ej: "1.5h")
    spotsAvailable: number;  // Cupos disponibles
    spots: number;           // Total de cupos
    accessibility: string[]; // Características de accesibilidad
  };
  isEnrolled?: boolean;      // ¿Ya inscrito?
  isWaitlisted?: boolean;    // ¿En lista de espera?
  onEnrollSuccess?: () => void; // Callback al inscribirse exitosamente
}

/**
 * COMPONENTE: TutoringCard
 * 
 * PROPÓSITO: Renderiza una tarjeta de tutoría con acciones de inscripción
 * 
 * ESTADOS INTERNOS:
 *   - enrolling: true mientras se procesa la inscripción (muestra spinner)
 *   - waitlisting: true mientras se procesa unirse a lista de espera
 */
const TutoringCard = ({ tutoring, isEnrolled, isWaitlisted, onEnrollSuccess }: TutoringProps) => {
  // Estado de carga durante inscripción
  const [enrolling, setEnrolling] = useState(false);
  // Estado de carga durante unirse a lista de espera
  const [waitlisting, setWaitlisting] = useState(false);
  // Hook para mostrar notificaciones toast
  const { toast } = useToast();

  // Obtiene el tipo de usuario para determinar qué botón mostrar
  const userType   = localStorage.getItem("userType");
  // Ratio de cupos disponibles (0 a 1) para la barra de progreso y colores
  const spotsRatio = tutoring.spots > 0 ? tutoring.spotsAvailable / tutoring.spots : 1;
  // Flag: si no hay cupos disponibles
  const isFull     = tutoring.spotsAvailable === 0;
  // Flag: si el usuario actual es tutor
  const isTutor    = userType === "tutor";

  /**
   * Clase CSS del badge de cupos según disponibilidad
   * - Sin cupos: rojo
   * - ≤20% cupos: naranja
   * - ≤50% cupos: amarillo
   * - >50% cupos: verde
   */
  const spotsBadgeClass =
    isFull            ? "bg-red-50 text-red-700 border-red-200"           :
    spotsRatio <= 0.2 ? "bg-orange-50 text-orange-700 border-orange-200"  :
    spotsRatio <= 0.5 ? "bg-yellow-50 text-yellow-700 border-yellow-200"  :
                        "bg-[#8DC63F]/10 text-[#578426] border-[#8DC63F]/30";

  /**
   * FUNCIÓN: handleEnroll
   * 
   * PROPÓSITO: Inscribe al estudiante en la sesión de tutoría
   * 
   * FLUJO:
   *   1. Activa estado de carga (enrolling = true)
   *   2. Obtiene token JWT de localStorage
   *   3. Hace POST a /auth/sessions/{id}/enroll con el token
   *   4. Si exitoso: muestra toast de éxito y ejecuta onEnrollSuccess
   *   5. Si error: muestra toast con mensaje de error
   *   6. Desactiva estado de carga
   */
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
        onEnrollSuccess?.();  // Notifica al padre para refrescar datos
      } else {
        toast({ variant: "destructive", title: "Error", description: data.detail || "No se pudo completar la inscripción" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión", description: "Inténtalo de nuevo más tarde" });
    } finally {
      setEnrolling(false);
    }
  };

  /**
   * FUNCIÓN: handleWaitlist
   * 
   * PROPÓSITO: Agrega al estudiante a la lista de espera de una tutoría llena
   * 
   * FLUJO:
   *   1. Activa estado de carga (waitlisting = true)
   *   2. Obtiene token JWT de localStorage
   *   3. Hace POST a /auth/sessions/{id}/waitlist con el token
   *   4. Si exitoso: muestra posición en lista de espera y ejecuta onEnrollSuccess
   *   5. Si error: muestra toast con mensaje de error
   *   6. Desactiva estado de carga
   */
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
        onEnrollSuccess?.();  // Notifica al padre para refrescar datos
      } else {
        toast({ variant: "destructive", title: "Error", description: data.detail || "No se pudo unir a la lista de espera" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión", description: "Inténtalo de nuevo más tarde" });
    } finally {
      setWaitlisting(false);
    }
  };

  // Color de la barra superior de la tarjeta según estado
  const topBarColor = isEnrolled ? "bg-[#8DC63F]" : isWaitlisted ? "bg-amber-400" : isFull ? "bg-red-400" : "bg-[#00AEEF]";

  return (
    <Card role="article" aria-label={`Tutoría de ${tutoring.subject} con ${tutoring.tutor}`} className={cn(
      "overflow-hidden transition-all hover:shadow-md group",
      // Estilos del borde según estado de inscripción
      isEnrolled   ? "border-[#8DC63F]/40 hover:border-[#8DC63F]/60"  :  // Inscrito: verde
      isWaitlisted ? "border-amber-300/50 bg-amber-50/30"              :  // En espera: ámbar
      isFull       ? "border-border/40 bg-muted/10"                    :  // Sin cupos: gris
                     "border-border/60 hover:border-[#00AEEF]/30"         // Disponible: azul al hover
    )}>
      {/* Barra de estado superior (indicador visual de color) */}
      <div className={cn("h-1 w-full", topBarColor)} />

      <CardContent className="p-4">
        {/* ── Header: Materia + Badge de estado ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            {/* Nombre de la materia */}
            <h3 className="font-bold text-base text-foreground leading-tight truncate">
              {tutoring.subject}
            </h3>
            {/* Nombre del tutor */}
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <User size={12} className="text-[#00AEEF] shrink-0" />
              <span className="truncate">{tutoring.tutor}</span>
            </p>
          </div>
          {/* Badge que muestra estado o cupos disponibles */}
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

        {/* ── Información de fecha, hora y salón ── */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Fecha */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
            <Calendar size={11} className="text-[#00AEEF] shrink-0" />
            <span className="truncate">{tutoring.date}</span>
          </div>
          {/* Hora */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
            <Clock size={11} className="text-[#00AEEF] shrink-0" />
            <span>{tutoring.time}</span>
          </div>
          {/* Salón (ocupa 2 columnas) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg col-span-2">
            <MapPin size={11} className="text-[#00AEEF] shrink-0" />
            <span className="truncate">{tutoring.room}</span>
          </div>
        </div>

        {/* ── Badges de accesibilidad ── */}
        {/* Solo se muestran si no está inscrito ni en espera y hay accesibilidades */}
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

        {/* ── Barra visual de cupos ── */}
        {/* Muestra proporción de cupos ocupados/disponibles */}
        {!isEnrolled && !isWaitlisted && tutoring.spots > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Cupos</span>
              <span>{tutoring.spotsAvailable}/{tutoring.spots}</span>
            </div>
            {/* Barra de progreso: color varía según porcentaje de ocupación */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all",
                isFull            ? "bg-red-400"    :  // Sin cupos
                spotsRatio <= 0.2 ? "bg-orange-400" :  // Pocos cupos
                spotsRatio <= 0.5 ? "bg-yellow-400" :  // Cupos moderados
                                    "bg-[#8DC63F]"     // Muchos cupos
              )} style={{ width: `${spotsRatio * 100}%` }} />
            </div>
          </div>
        )}

        {/* ── Botón de acción ── */}
        {/* El botón cambia según el rol del usuario y estado de inscripción */}
        {isTutor ? (
          // TUTOR: Muestra que es su sesión (no puede inscribirse a sí mismo)
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-muted text-muted-foreground">
            Tu sesión programada
          </Button>
        ) : isEnrolled ? (
          // INSCRITO: Muestra confirmación de inscripción
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-[#8DC63F]/10 text-[#578426] border border-[#8DC63F]/40">
            <CheckCircle2 size={14} /> Ya estás inscrito
          </Button>
        ) : isWaitlisted ? (
          // EN ESPERA: Muestra que está en lista de espera
          <Button variant="ghost" disabled className="w-full h-9 text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 size={14} /> En lista de espera
          </Button>
        ) : isFull ? (
          // SIN CUPOS: Ofrece unirse a lista de espera
          <Button
            variant="ghost"
            className="w-full h-9 text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
            onClick={handleWaitlist}
            disabled={waitlisting}
          >
            {waitlisting ? <><Loader2 size={14} className="animate-spin" /> Procesando...</> : <><Clock3 size={14} /> Unirme a lista de espera</>}
          </Button>
        ) : (
          // CON CUPOS: Botón para inscribirse
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