import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ucareTransforms } from "@/lib/uploadcare";

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
  ctaText,
  ctaVariant = "default",
  showCta = true,
  onClick,
  horizontal = false,
}: VehicleCardBaseProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const buttonText = ctaText || t("translation:vehicle.viewAuction");

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
    <div className={cn("relative overflow-hidden bg-muted", !horizontal && aspectRatioClass, horizontal && "aspect-[4/3] md:aspect-square", imageClassName)}>
      <img src={ucareTransforms.cardThumb(image)} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {badge && <div className="absolute left-4 top-4">{badge}</div>}
      {overlay && <div className="absolute right-3 top-3">{overlay}</div>}
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
        ctaVariant === "default" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      )}
      aria-label={t("translation:common.viewAuctionFor", { title, defaultValue: `${buttonText} for ${title}` })}
    >
      {buttonText}
    </Button>
  );

  if (horizontal) {
    return (
      <Card className={cn("group overflow-hidden transition-shadow duration-300 hover:shadow-elevated", className)}>
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          {imageSection}
          <div className="flex flex-col justify-between p-6">
            {children}
            {footer && <div className="mt-4">{footer}</div>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("group overflow-hidden transition-all duration-300 hover:shadow-elevated", className)}>
      {imageSection}
      {children}
      {(showCta || footer) && (
        <div className="space-y-2 px-4 pb-4 pt-2">
          {footer}
          {ctaButton}
        </div>
      )}
    </Card>
  );
};
