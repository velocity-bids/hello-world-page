import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VehicleGallery } from "@/components/VehicleGallery";
import { CommentSection } from "@/components/CommentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { BiddingCard, RecentBidsCard, SellerCard, VehicleInfo } from "@/components/vehicle";
import { PageLoader } from "@/components/common";
import { ShareButtons } from "@/components/ShareButtons";
import { ReportModal } from "@/components/ReportModal";
import { supabase } from "@/integrations/supabase/client";
import { getVehicleById, getRecentBidsForVehicle, fetchUserProfile, enrichWithProfiles } from "@/db/queries";
import { bidKeys, vehicleKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useWatchedVehicles } from "@/hooks/useWatchedVehicles";
import { useBidSubmission } from "@/hooks/useBidSubmission";
import { useAdminApproval } from "@/hooks/useAdminApproval";
import { toast } from "sonner";
import { BidHistoryModal } from "@/components/BidHistoryModal";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import type { Bid, Vehicle as VehicleType, UserProfile } from "@/types";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

interface VehicleWithProfile extends VehicleType {
  profiles?: UserProfile | null;
}

const VehicleDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { openLoginModal } = useAuthModal();
  const { addToWatchlist, removeFromWatchlist, isWatching } = useWatchedVehicles();

  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);

  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useQuery<VehicleWithProfile>({
    queryKey: id ? vehicleKeys.detail(id) : vehicleKeys.details(),
    queryFn: async () => {
      if (!id) throw new Error("Missing vehicle id");
      const { data, error } = await getVehicleById(id);
      if (error || !data) throw error ?? new Error("Vehicle not found");
      const sellerProfile = await fetchUserProfile(data.seller_id);
      return { ...data, profiles: sellerProfile };
    },
    enabled: !!id,
    retry: false,
  });

  const { data: bids = [], error: bidsError } = useQuery<Bid[]>({
    queryKey: id ? bidKeys.forVehicle(id) : bidKeys.all,
    queryFn: async () => {
      if (!id) throw new Error("Missing vehicle id");
      const { data, error } = await getRecentBidsForVehicle(id, 3);
      if (error) throw error;
      return enrichWithProfiles(data ?? [], (bid) => bid.bidder_id);
    },
    enabled: !!id,
    retry: false,
  });

  const winningBidderId = bids[0]?.bidder_id ?? null;
  const { timeLeft, isEnded } = useCountdown(vehicle?.auction_end_time || null);

  const { bidAmount, setBidAmount, submitting, minBid, handlePlaceBid, handleQuickBid } = useBidSubmission({
    vehicle: vehicle ?? null,
    userId: user?.id,
    onSuccess: (amount) => {
      if (!id) return;
      queryClient.setQueryData<VehicleWithProfile>(vehicleKeys.detail(id), (currentVehicle) =>
        currentVehicle ? { ...currentVehicle, current_bid: amount, bid_count: (currentVehicle.bid_count || 0) + 1 } : currentVehicle
      );
    },
  });

  const { adminNotes, setAdminNotes, adminSubmitting, handleAdminAction } = useAdminApproval({
    vehicleId: vehicle?.id,
    onStatusChange: (status, notes) => {
      if (!id) return;
      queryClient.setQueryData<VehicleWithProfile>(vehicleKeys.detail(id), (currentVehicle) =>
        currentVehicle ? { ...currentVehicle, approval_status: status, admin_notes: notes } : currentVehicle
      );
    },
  });

  useEffect(() => {
    if (!vehicleError) return;
    if (import.meta.env.DEV) console.error("Error fetching vehicle:", vehicleError);
    toast.error(t("translation:errors.failedLoadAuction"));
    navigate("/");
  }, [vehicleError, navigate, t]);

  useEffect(() => {
    if (!bidsError || !import.meta.env.DEV) return;
    console.error("Error fetching bids:", bidsError);
  }, [bidsError]);

  useEffect(() => {
    if (!id || !user) {
      setWatching(false);
      return;
    }

    const checkWatchStatus = async () => {
      const isWatched = await isWatching(id);
      setWatching(isWatched);
    };

    checkWatchStatus();
  }, [id, user, isWatching]);

  useEffect(() => {
    if (!id) return;

    const vehicleChannel = supabase
      .channel(`vehicle-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vehicles", filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
      })
      .subscribe();

    const bidsChannel = supabase
      .channel(`bids-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids", filter: `vehicle_id=eq.${id}` }, (payload) => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: bidKeys.forVehicle(id) });
        toast.success(t("translation:bidding.newBidPlaced"), { description: `${formatCurrency((payload.new as Bid).amount)}` });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [id, queryClient, t]);

  const handlePlaceBidWithAuth = async () => {
    if (!user) {
      toast.error(t("translation:bidding.pleaseSignInToBid"));
      openLoginModal();
      return;
    }
    await handlePlaceBid();
  };

  const handleWatchToggle = async () => {
    if (!user) {
      toast.error(t("translation:bidding.pleaseSignInToWatch"));
      openLoginModal();
      return;
    }

    if (!id) return;

    setWatchLoading(true);

    if (watching) {
      const success = await removeFromWatchlist(id);
      if (success) setWatching(false);
    } else {
      const success = await addToWatchlist(id);
      if (success) setWatching(true);
    }

    setWatchLoading(false);
  };

  if (vehicleLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <PageLoader message={t("translation:vehicle.loadingAuction")} />
      </main>
    );
  }

  if (!vehicle) return null;

  const approvalStatus = vehicle.approval_status || "pending";
  const isOwnListing = user?.id === vehicle.seller_id;

  if (!isAdmin && !isOwnListing && approvalStatus !== "approved") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{t("translation:vehicle.notAvailable")}</p>
      </main>
    );
  }

  const reserveMet = vehicle.reserve_price ? vehicle.current_bid >= vehicle.reserve_price : false;
  const canShowFeedback = isEnded && winningBidderId && (user?.id === vehicle.seller_id || user?.id === winningBidderId);
  const vehicleTitle = getVehicleTitle(vehicle);
  const vehicleUrl = typeof window !== "undefined" ? window.location.href : "";
  const showAdminPanel = isAdmin && !isOwnListing;
  const approvalLabel =
    approvalStatus === "approved"
      ? t("translation:myListings.approved")
      : approvalStatus === "declined"
      ? t("translation:admin.declinedTab")
      : t("translation:myListings.pendingReview");

  return (
    <>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <VehicleGallery
                  images={vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image_url || "/placeholder.svg"]}
                  vehicleName={vehicleTitle}
                />
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <ShareButtons
                  url={vehicleUrl}
                  title={vehicleTitle}
                  description={vehicle.description || t("translation:common.checkOutAuction", { title: vehicleTitle })}
                />
                {user && !isOwnListing && <ReportModal vehicleId={vehicle.id} vehicleTitle={vehicleTitle} />}
              </div>

              <VehicleInfo vehicle={vehicle} isActive={vehicle.status === "active"} />

              {vehicle.description && (
                <Card className="my-6 p-6">
                  <h2 className="mb-4 text-2xl font-semibold">{t("translation:vehicle.description")}</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">{vehicle.description}</p>
                </Card>
              )}

              <CommentSection vehicleId={vehicle.id} />
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                <BiddingCard
                  currentBid={vehicle.current_bid}
                  bidCount={vehicle.bid_count}
                  timeLeft={timeLeft}
                  isEnded={isEnded}
                  reservePrice={vehicle.reserve_price}
                  reserveMet={reserveMet}
                  isOwnListing={isOwnListing}
                  isAdmin={isAdmin}
                  isApproved={approvalStatus === "approved"}
                  bidAmount={bidAmount}
                  onBidAmountChange={setBidAmount}
                  onPlaceBid={handlePlaceBidWithAuth}
                  onQuickBid={handleQuickBid}
                  onWatchToggle={handleWatchToggle}
                  submitting={submitting}
                  watching={watching}
                  watchLoading={watchLoading}
                  minBid={minBid}
                  isActive={vehicle.status === "active"}
                />

                <SellerCard sellerId={vehicle.seller_id} profile={vehicle.profiles} />

                {showAdminPanel && (
                  <Card className="border-primary/20 bg-primary/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{t("translation:admin.adminActions")}</h3>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("translation:admin.status")}:</span>
                      <Badge variant={approvalStatus === "approved" ? "default" : approvalStatus === "declined" ? "destructive" : "secondary"}>
                        {approvalLabel}
                      </Badge>
                    </div>

                    {vehicle.admin_notes && (
                      <div className="mb-4 rounded-md bg-muted p-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">{t("translation:admin.adminNotes")}:</p>
                        <p className="text-sm">{vehicle.admin_notes}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Textarea placeholder={t("translation:admin.addInternalNotes")} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="bg-background" />

                      <div className="flex gap-2">
                        <Button onClick={() => handleAdminAction("approved")} disabled={adminSubmitting || approvalStatus === "approved"} className="flex-1" size="sm">
                          {adminSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                          {t("translation:admin.approve")}
                        </Button>
                        <Button onClick={() => handleAdminAction("declined")} disabled={adminSubmitting || approvalStatus === "declined"} variant="destructive" className="flex-1" size="sm">
                          {adminSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                          {t("translation:admin.decline")}
                        </Button>
                      </div>

                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/admin")}>
                        {t("translation:admin.backToDashboard")}
                      </Button>
                    </div>
                  </Card>
                )}

                {canShowFeedback && <FeedbackForm vehicleId={vehicle.id} sellerId={vehicle.seller_id} winningBidderId={winningBidderId} />}

                <RecentBidsCard bids={bids} onViewAll={() => setShowBidHistory(true)} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <BidHistoryModal vehicleId={vehicle.id} isOpen={showBidHistory} onClose={() => setShowBidHistory(false)} />
    </>
  );
};

export default VehicleDetail;
