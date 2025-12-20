import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFullProfile, getFeedbackForUser, getActiveVehiclesBySeller, getPastVehiclesBySeller, getProfileDisplayInfo, type FullProfile } from "@/db/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProfileHeader, ReputationCard, FeedbackList, StatsCard, ListingGrid } from "@/components/profile";
import { PageLoader } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Vehicle, FeedbackWithReviewer } from "@/types";

const UserProfilePage = () => {
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
                display_name: reviewerProfile?.display_name || "Anonymous",
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
        toast.error("Failed to load user profile");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container py-8">
          <PageLoader message="Loading profile..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container py-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground">The user profile you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalListings = activeListings.length + pastListings.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="space-y-8">
          <ProfileHeader
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name || "Anonymous"}
            memberSince={profile.member_since || ""}
            bio={profile.bio}
            verified={profile.verified}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
                Current Listings ({activeListings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1 sm:flex-none">
                Past Listings ({pastListings.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
              <ListingGrid
                listings={activeListings}
                title="Current Listings"
                description="Active auctions from this seller"
                emptyMessage="No active listings at the moment"
                isPast={false}
              />
            </TabsContent>
            <TabsContent value="past" className="mt-6">
              <ListingGrid
                listings={pastListings}
                title="Past Listings"
                description="Completed auctions from this seller"
                emptyMessage="No past listings to show"
                isPast={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfilePage;
