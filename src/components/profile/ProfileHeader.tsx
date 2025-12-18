import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  memberSince: string;
  bio?: string | null;
  verified?: boolean;
}

export const ProfileHeader = ({ avatarUrl, displayName, memberSince, bio, verified }: ProfileHeaderProps) => {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayName}</h1>
              {verified && <VerifiedBadge size="lg" showText />}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Member since {format(new Date(memberSince), "MMMM yyyy")}
              </span>
            </div>
            
            {bio && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
