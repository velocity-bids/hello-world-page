import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ReputationCard } from "@/components/profile/ReputationCard";
import { FeedbackList } from "@/components/profile/FeedbackList";
import { StatsCard } from "@/components/profile/StatsCard";
import { ListingGrid } from "@/components/profile/ListingGrid";
import { PageLoader } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Vehicle, UserProfile as UserProfileType, FeedbackWithReviewer } from "@/types";

interface FeedbackWithReviewerLocal extends FeedbackWithReviewer {
  reviewer: { display_name: string; avatar_url: string | null };
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfileType & { bio: string | null } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackWithReviewer[]>([]);
  const [activeListings, setActiveListings] = useState<Vehicle[]>([]);
  const [pastListings, setPastListings] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, bio, member_since, rating, vehicles_sold, verified")
          .eq("user_id", userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: feedbackData, error: feedbackError } = await supabase
          .from("feedback")
          .select("id, rating, comment, created_at, reviewer_id")
          .eq("reviewee_id", userId)
          .order("created_at", { ascending: false });

        if (feedbackError) throw feedbackError;

        const feedbackWithReviewers = await Promise.all(
          (feedbackData || []).map(async (fb) => {
            const { data: reviewerProfile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", fb.reviewer_id)
              .single();

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

        const { data: activeData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("seller_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        setActiveListings(activeData || []);

        const { data: pastData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("seller_id", userId)
          .neq("status", "active")
          .order("auction_end_time", { ascending: false });

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
