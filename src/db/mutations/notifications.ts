import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

/**
 * Mark a single notification as read (scoped to the owning user)
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
