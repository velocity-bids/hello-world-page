import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface FeedbackListProps {
  feedback: Feedback[];
}

export const FeedbackList = ({ feedback }: FeedbackListProps) => {
  const { t, i18n } = useTranslation();
  const timeLocale = i18n.language.startsWith("pt") ? pt : enGB;

  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("translation:profile.feedback")}</CardTitle>
          <CardDescription>{t("translation:profile.noFeedbackYet")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("translation:profile.noFeedbackDescription")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("translation:profile.feedback")}</CardTitle>
        <CardDescription>{t("translation:profile.review", { count: feedback.length })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((item) => {
          const initials = item.reviewer.display_name
            .split("translation: ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.reviewer.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{item.reviewer.display_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= item.rating ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: timeLocale })}
                      </span>
                    </div>
                  </div>

                  {item.comment && <p className="text-sm leading-relaxed text-muted-foreground">{item.comment}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
