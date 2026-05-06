import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const VerifiedBadge = ({ size = "md", showText = false }: VerifiedBadgeProps) => {
  const { t } = useTranslation();
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badgeContent = (
    <Badge variant="secondary" className="gap-1 border-accent/30 bg-accent/20 font-medium text-accent">
      <CheckCircle2 className={iconSizes[size]} />
      {showText && <span>{t("translation:vehicle.verified")}</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{t("translation:vehicle.trustedSeller")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
