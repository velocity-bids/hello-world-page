import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface VehicleCardBaseProps {
  id: string;
  image: string;
  title: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: "4/3" | "16/9" | "square";
  badge?: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  ctaText?: string;
  ctaVariant?: "default" | "outline";
  showCta?: boolean;
  onClick?: () => void;
  horizontal?: boolean;
}

export const VehicleCardBase = ({
  id,
  image,
  title,
  className,
  imageClassName,
  aspectRatio = "4/3",
  badge,
  overlay,
  children,
  footer,
  ctaText = "View Auction",
  ctaVariant = "default",
  showCta = true,
  onClick,
  horizontal = false,
}: VehicleCardBaseProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/vehicle/${id}`);
    }
  };

  const aspectRatioClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    square: "aspect-square",
  }[aspectRatio];

  const imageSection = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        !horizontal && aspectRatioClass,
        horizontal && "aspect-[4/3] md:aspect-square",
        imageClassName
      )}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {badge && (
        <div className="absolute left-4 top-4">{badge}</div>
      )}
      {overlay && (
        <div className="absolute right-3 top-3">{overlay}</div>
      )}
    </div>
  );

  const ctaButton = showCta && (
    <Button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClick();
      }}
      variant={ctaVariant}
      className={cn(
        "w-full font-semibold transition-all duration-300",
        ctaVariant === "default" && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      )}
      aria-label={`${ctaText} for ${title}`}
    >
      {ctaText}
    </Button>
  );

  if (horizontal) {
    return (
      <Card
        className={cn(
          "overflow-hidden transition-shadow duration-300 hover:shadow-elevated group",
          className
        )}
      >
        <div className="grid md:grid-cols-[280px_1fr] gap-0">
          {imageSection}
          <div className="p-6 flex flex-col justify-between">
            {children}
            {footer && <div className="mt-4">{footer}</div>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-elevated",
        className
      )}
    >
      {imageSection}
      {children}
      {(showCta || footer) && (
        <div className="px-4 pb-4 pt-2 space-y-2">
          {footer}
          {ctaButton}
        </div>
      )}
    </Card>
  );
};
