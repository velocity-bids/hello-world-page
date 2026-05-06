import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format, isValid } from "date-fns";
import { useTranslation } from "react-i18next";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  memberSince: string;
  bio?: string | null;
  verified?: boolean;
}

export const ProfileHeader = ({ avatarUrl, displayName, memberSince, bio, verified }: ProfileHeaderProps) => {
  const { t } = useTranslation();
  const initials = displayName
    .split("translation: ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col items-start gap-6 md:flex-row">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg md:h-32 md:w-32">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{displayName}</h1>
              {verified && <VerifiedBadge size="lg" showText />}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {memberSince && isValid(new Date(memberSince))
                  ? t("translation:profile.memberSince", { date: format(new Date(memberSince), "MMMM yyyy") })
                  : t("translation:profile.member")}
              </span>
            </div>

            {bio && <p className="max-w-2xl leading-relaxed text-muted-foreground">{bio}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
