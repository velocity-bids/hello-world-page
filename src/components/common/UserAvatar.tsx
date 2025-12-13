import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: string;
  displayName?: string | null;
  verified?: boolean | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  linkToProfile?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export const UserAvatar = ({
  userId,
  displayName,
  verified,
  avatarUrl,
  size = "md",
  showName = true,
  linkToProfile = true,
  subtitle,
  className,
}: UserAvatarProps) => {
  const name = displayName || "Anonymous User";

  const avatarElement = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted flex-shrink-0",
        sizeClasses[size]
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );

  const nameElement = showName && (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        {linkToProfile ? (
          <Link
            to={`/user/${userId}`}
            className="truncate font-medium hover:text-accent transition-colors hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="truncate font-medium">{name}</span>
        )}
        {verified && <VerifiedBadge size="sm" />}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      {avatarElement}
      {nameElement}
    </div>
  );

  if (linkToProfile && !showName) {
    return (
      <Link to={`/user/${userId}`} className="hover:opacity-80 transition-opacity">
        {avatarElement}
      </Link>
    );
  }

  return content;
};
