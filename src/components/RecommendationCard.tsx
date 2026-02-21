import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecommendationCardProps {
  icon?: React.ReactNode;
  title: string;
  reason: string;
  actionLabel?: string;
  onAction?: () => void;
}

const RecommendationCard = ({ icon, title, reason, actionLabel = "Ver más", onAction }: RecommendationCardProps) => (
  <Card className="border-primary/20 bg-primary/5">
    <CardContent className="p-4 flex items-start gap-3">
      <div className="bg-primary/10 rounded-full p-2 shrink-0 mt-0.5">
        {icon || <Lightbulb className="h-4 w-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
        {onAction && (
          <Button variant="link" size="sm" className="px-0 h-auto mt-1 text-xs" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default RecommendationCard;
