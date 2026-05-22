/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: RecommendationCard - Tarjeta de recomendación
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Muestra una tarjeta compacta con una recomendación para el estudiante
 *   (ej: "Tutoría recomendada", "Salón disponible"). Incluye icono, título,
 *   razón de la recomendación y un botón de acción opcional.
 * 
 * FLUJO:
 *   1. Recibe props: icon, title, reason, actionLabel, onAction
 *   2. Renderiza icono (por defecto Lightbulb si no se pasa)
 *   3. Muestra título en negrita y razón como texto secundario
 *   4. Si se pasa onAction, muestra botón de acción (ej: "Ver más")
 * 
 * USO:
 *   <RecommendationCard
 *     title="Tutoría recomendada"
 *     reason="Coincide con tu hora libre"
 *     onAction={() => navigate("/rooms")}
 *   />
 */

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * INTERFAZ: RecommendationCardProps
 * 
 * Define las propiedades que acepta el componente:
 * - icon: Icono personalizado (ReactNode). Si no se pasa, usa Lightbulb
 * - title: Título de la recomendación (obligatorio)
 * - reason: Texto explicativo de por qué se recomienda (obligatorio)
 * - actionLabel: Texto del botón de acción (por defecto "Ver más")
 * - onAction: Callback cuando se presiona el botón de acción
 */
interface RecommendationCardProps {
  icon?: React.ReactNode;
  title: string;
  reason: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * COMPONENTE: RecommendationCard
 * 
 * PROPÓSITO: Renderiza una tarjeta de recomendación con estilos UNAB
 * 
 * ESTRUCTURA:
 *   ┌─────────────────────────────────────┐
 *   │ [Icono]  Título de la recomendación │
 *   │          Razón de la recomendación  │
 *   │          [Ver más]                  │
 *   └─────────────────────────────────────┘
 * 
 * ESTILOS:
 *   - Borde y fondo con tono azul UNAB (#00AEEF)
 *   - Hover: intensifica el borde y fondo
 *   - Transición suave en todos los cambios de estilo
 */
const RecommendationCard = ({ icon, title, reason, actionLabel = "Ver más", onAction }: RecommendationCardProps) => (
  <div className="flex items-start gap-3 rounded-xl border border-[#00AEEF]/20 bg-[#00AEEF]/5 px-4 py-3 hover:border-[#00AEEF]/40 hover:bg-[#00AEEF]/8 transition-all">
    {/* Contenedor del icono con fondo azul suave */}
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00AEEF]/15 mt-0.5">
      {/* Usa icono personalizado o Lightbulb por defecto */}
      {icon || <Lightbulb className="h-4 w-4 text-[#0090C5]" />}
    </div>
    {/* Contenido de texto */}
    <div className="flex-1 min-w-0">
      {/* Título de la recomendación */}
      <p className="font-semibold text-sm text-foreground leading-tight">{title}</p>
      {/* Razón/descripción de la recomendación */}
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{reason}</p>
      {/* Botón de acción (solo si se pasa onAction) */}
      {onAction && (
        <Button variant="link" size="sm" className="px-0 h-auto mt-1 text-xs text-[#00AEEF] hover:text-[#0090C5]" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  </div>
);

export default RecommendationCard;