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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Profile {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  member_since: string;
  rating: number | null;
  vehicles_sold: number;
  verified: boolean;
}

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

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
  current_bid: number;
  bid_count: number;
  auction_end_time: string;
  status: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [activeListings, setActiveListings] = useState<Vehicle[]>([]);
  const [pastListings, setPastListings] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, bio, member_since, rating, vehicles_sold, verified")
          .eq("user_id", userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("feedback")
          .select("id, rating, comment, created_at, reviewer_id")
          .eq("reviewee_id", userId)
          .order("created_at", { ascending: false });

        if (feedbackError) throw feedbackError;

        // Fetch reviewer profiles for each feedback
        const feedbackWithReviewers = await Promise.all(
          (feedbackData || []).map(async (fb) => {
            const { data: reviewerProfile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", fb.reviewer_id)
              .single();

            return {
              id: fb.id,
              rating: fb.rating,
              comment: fb.comment,
              created_at: fb.created_at,
              reviewer: {
                display_name: reviewerProfile?.display_name || "Anonymous",
                avatar_url: reviewerProfile?.avatar_url || null,
              },
            };
          })
        );

        setFeedback(feedbackWithReviewers);

        // Fetch active listings
        const { data: activeData, error: activeError } = await supabase
          .from("vehicles")
          .select("id, make, model, year, image_url, current_bid, bid_count, auction_end_time, status")
          .eq("seller_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (activeError) throw activeError;
        setActiveListings(activeData || []);

        // Fetch past listings
        const { data: pastData, error: pastError } = await supabase
          .from("vehicles")
          .select("id, make, model, year, image_url, current_bid, bid_count, auction_end_time, status")
          .eq("seller_id", userId)
          .neq("status", "active")
          .order("auction_end_time", { ascending: false });

        if (pastError) throw pastError;
        setPastListings(pastData || []);
      } catch (error: any) {
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
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 lg:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
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
            <p className="text-muted-foreground">
              The user profile you're looking for doesn't exist.
            </p>
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
          {/* Profile Header */}
          <ProfileHeader
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            memberSince={profile.member_since}
            bio={profile.bio}
            verified={profile.verified}
          />

          {/* Stats and Reputation */}
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
              <ReputationCard
                rating={profile.rating}
                totalFeedback={feedback.length}
              />
            </div>
          </div>

          {/* Listings Tabs */}
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

export default UserProfile;
