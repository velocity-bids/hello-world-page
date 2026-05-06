import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, CheckCircle, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatsCardProps {
  completedSales: number;
  activeListings: number;
  pastListings: number;
  totalListings: number;
}

export const StatsCard = ({ completedSales, activeListings, pastListings, totalListings }: StatsCardProps) => {
  const { t } = useTranslation();
  const sellThroughRate = totalListings > 0 ? ((completedSales / totalListings) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      label: t("translation:profile.completedSales"),
      value: completedSales,
      icon: CheckCircle,
      description: t("translation:profile.completedSalesDescription"),
    },
    {
      label: t("translation:profile.activeListings"),
      value: activeListings,
      icon: TrendingUp,
      description: t("translation:profile.activeListingsDescription"),
    },
    {
      label: t("translation:profile.pastListings"),
      value: pastListings,
      icon: Package,
      description: t("translation:profile.pastListingsDescription"),
    },
    {
      label: t("translation:profile.sellThroughRate"),
      value: `${sellThroughRate}%`,
      icon: BarChart3,
      description: t("translation:profile.sellThroughRateDescription", { completed: completedSales, total: totalListings }),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("translation:profile.marketplaceActivity")}</CardTitle>
        <CardDescription>{t("translation:profile.performanceMetrics")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
