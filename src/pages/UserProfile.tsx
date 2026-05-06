import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { getFullProfile, getFeedbackForUser, getActiveVehiclesBySeller, getPastVehiclesBySeller, getProfileDisplayInfo, type FullProfile } from "@/db/queries";
import { ProfileHeader, ReputationCard, FeedbackList, StatsCard, ListingGrid } from "@/components/profile";
import { PageLoader } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Vehicle, FeedbackWithReviewer } from "@/types";

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [feedback, setFeedback] = useState<FeedbackWithReviewer[]>([]);
  const [activeListings, setActiveListings] = useState<Vehicle[]>([]);
  const [pastListings, setPastListings] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const { data: profileData, error: profileError } = await getFullProfile(userId);
        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: feedbackData, error: feedbackError } = await getFeedbackForUser(userId);
        if (feedbackError) throw feedbackError;

        const feedbackWithReviewers = await Promise.all(
          (feedbackData || []).map(async (fb) => {
            const { data: reviewerProfile } = await getProfileDisplayInfo(fb.reviewer_id);

            return {
              ...fb,
              reviewer: {
                display_name: reviewerProfile?.display_name || t("translation:common.anonymous"),
                avatar_url: reviewerProfile?.avatar_url || null,
              },
            } as FeedbackWithReviewer;
          })
        );

        setFeedback(feedbackWithReviewers);

        const { data: activeData } = await getActiveVehiclesBySeller(userId);
        setActiveListings(activeData || []);

        const { data: pastData } = await getPastVehiclesBySeller(userId);
        setPastListings(pastData || []);
      } catch (error) {
        toast.error(t("translation:errors.failedLoadUserProfile"));
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, t]);

  if (loading) {
    return (
      <main className="container flex-1 py-8">
        <PageLoader message={t("translation:profile.loadingProfile")} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container flex-1 py-8">
        <div className="py-12 text-center">
          <h1 className="mb-4 text-3xl font-bold">{t("translation:profile.userNotFound")}</h1>
          <p className="text-muted-foreground">{t("translation:profile.userNotFoundDescription")}</p>
        </div>
      </main>
    );
  }

  const totalListings = activeListings.length + pastListings.length;

  return (
    <main className="container flex-1 py-8">
      <div className="space-y-8">
        <ProfileHeader
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name || t("translation:common.anonymous")}
          memberSince={profile.member_since || ""}
          bio={profile.bio}
          verified={profile.verified}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <StatsCard
              completedSales={profile.vehicles_sold || 0}
              activeListings={activeListings.length}
              pastListings={pastListings.length}
              totalListings={totalListings}
            />
            <FeedbackList feedback={feedback} />
          </div>
          <div>
            <ReputationCard rating={profile.rating} totalFeedback={feedback.length} />
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1 sm:flex-none">
              {t("translation:profile.currentListings")} ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 sm:flex-none">
              {t("translation:profile.pastListings")} ({pastListings.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            <ListingGrid
              listings={activeListings}
              title={t("translation:profile.currentListings")}
              description={t("translation:profile.currentListingsDescription")}
              emptyMessage={t("translation:profile.currentListingsEmpty")}
              isPast={false}
            />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <ListingGrid
              listings={pastListings}
              title={t("translation:profile.pastListings")}
              description={t("translation:profile.pastListingsDescriptionTab")}
              emptyMessage={t("translation:profile.pastListingsEmpty")}
              isPast
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default UserProfilePage;
