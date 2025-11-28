import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface CommentSectionProps {
  vehicleId: string;
}

export const CommentSection = ({ vehicleId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching comments:", error);
        }
        return;
      }

      // Fetch public profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from("public_profiles")
            .select("display_name")
            .eq("user_id", comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            profiles: profileData,
          };
        })
      );

      setComments(commentsWithProfiles);
    };

    fetchComments();
  }, [vehicleId]);

  // Subscribe to new comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${vehicleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from("public_profiles")
            .select("display_name")
            .eq("user_id", (payload.new as any).user_id)
            .maybeSingle();

          const newComment = {
            ...payload.new as Comment,
            profiles: profileData,
          };

          setComments((prev) => [newComment, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error posting comment:", error);
      }
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted!");
      setNewComment("");
    }

    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error deleting comment:", error);
      }
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-2xl font-semibold">Comments</h2>

      {/* Add comment form */}
      {user ? (
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder="Share your thoughts about this vehicle..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      ) : (
        <div className="mb-6 rounded-lg bg-muted p-4 text-center text-muted-foreground">
          Please sign in to leave a comment
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <Link 
                      to={`/user/${comment.user_id}`}
                      className="font-medium hover:text-accent transition-colors hover:underline"
                    >
                      {comment.profiles?.display_name || "Anonymous User"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {user && user.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
