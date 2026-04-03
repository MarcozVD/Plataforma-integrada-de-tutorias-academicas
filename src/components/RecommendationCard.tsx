import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationCardProps {
  icon?: React.ReactNode;
  title: string;
  reason: string;
  actionLabel?: string;
  onAction?: () => void;
}

const RecommendationCard = ({ icon, title, reason, actionLabel = "Ver más", onAction }: RecommendationCardProps) => (
  <div className="flex items-start gap-3 rounded-xl border border-[#00AEEF]/20 bg-[#00AEEF]/5 px-4 py-3 hover:border-[#00AEEF]/40 hover:bg-[#00AEEF]/8 transition-all">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00AEEF]/15 mt-0.5">
      {icon || <Lightbulb className="h-4 w-4 text-[#0090C5]" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground leading-tight">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{reason}</p>
      {onAction && (
        <Button variant="link" size="sm" className="px-0 h-auto mt-1 text-xs text-[#00AEEF] hover:text-[#0090C5]" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  </div>
);

export default RecommendationCard;