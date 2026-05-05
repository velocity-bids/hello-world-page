import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageLoader, EmptyState } from "@/components/common";
import { useWatchedVehicles } from "@/hooks/useWatchedVehicles";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { formatTimeRemaining } from "@/hooks/useCountdown";
import { Eye, Mail, Bell, Trash2 } from "lucide-react";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

const Watching = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { watchedVehicles, loading, removeFromWatchlist, updateNotificationPreferences } = useWatchedVehicles();

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  if (loading || authLoading) {
    return (
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Watching</h1>
          <PageLoader />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Eye className="h-8 w-8" />
              Watching
            </h1>
            <p className="mt-2 text-muted-foreground">
              {watchedVehicles.length} {watchedVehicles.length === 1 ? "auction" : "auctions"} you're watching
            </p>
          </div>
        </div>

        {watchedVehicles.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="No watched auctions yet"
            description="Start watching auctions to get notified about updates"
            action={{ label: "Browse Auctions", onClick: () => navigate("/auctions") }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {watchedVehicles.map((watched) => {
              const vehicle = watched.vehicles;
              const timeLeft = formatTimeRemaining(vehicle.auction_end_time);
              const isEnded = timeLeft === "Ended";

              return (
                <Card key={watched.id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative">
                    <img
                      src={vehicle.image_url || "/placeholder.svg"}
                      alt={getVehicleTitle(vehicle)}
                      className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <Badge variant={isEnded ? "secondary" : "default"} className="absolute right-2 top-2">
                      {timeLeft}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-1 text-lg font-semibold">
                      {getVehicleTitle(vehicle)}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {vehicle.mileage.toLocaleString()} km
                    </p>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(vehicle.current_bid)}
                      </p>
                    </div>

                    <div className="mb-4 space-y-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`notify-sale-${watched.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          Notify on sale
                        </Label>
                        <Switch
                          id={`notify-sale-${watched.id}`}
                          checked={watched.notify_on_sale}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences(vehicle.id, checked, watched.notify_on_bid)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`notify-bid-${watched.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Bell className="h-4 w-4" />
                          Notify on bids
                        </Label>
                        <Switch
                          id={`notify-bid-${watched.id}`}
                          checked={watched.notify_on_bid}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences(vehicle.id, watched.notify_on_sale, checked)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                        View Auction
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeFromWatchlist(vehicle.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Watching;
