import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const VerifiedBadge = ({ size = "md", showText = false }: VerifiedBadgeProps) => {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badgeContent = (
    <Badge 
      variant="secondary" 
      className="bg-accent/20 text-accent border-accent/30 gap-1 font-medium"
    >
      <CheckCircle2 className={iconSizes[size]} />
      {showText && <span>Verified</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>Trusted Seller: 5+ sales & 4.5★+ rating</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
