import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, CheckCircle, BarChart3 } from "lucide-react";

interface StatsCardProps {
  completedSales: number;
  activeListings: number;
  pastListings: number;
  totalListings: number;
}

export const StatsCard = ({
  completedSales,
  activeListings,
  pastListings,
  totalListings,
}: StatsCardProps) => {
  const sellThroughRate = totalListings > 0 
    ? ((completedSales / totalListings) * 100).toFixed(1)
    : "0.0";

  const stats = [
    {
      label: "Completed Sales",
      value: completedSales,
      icon: CheckCircle,
      description: "Successfully sold vehicles",
    },
    {
      label: "Active Listings",
      value: activeListings,
      icon: TrendingUp,
      description: "Currently available",
    },
    {
      label: "Past Listings",
      value: pastListings,
      icon: Package,
      description: "Ended auctions",
    },
    {
      label: "Sell-Through Rate",
      value: `${sellThroughRate}%`,
      icon: BarChart3,
      description: `${completedSales} of ${totalListings} sold`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Activity</CardTitle>
        <CardDescription>Performance metrics and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
