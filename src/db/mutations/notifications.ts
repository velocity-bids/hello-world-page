import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
import type { MutationResult } from "./types";

/**
 * Mark a single notification as read (scoped to the owning user)
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)
  );
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
  );
}
