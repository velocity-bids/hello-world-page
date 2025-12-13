import { supabase } from "@/integrations/supabase/client";
import type { QueryListResult } from "./types";

// Local notification type matching DB schema
interface DbNotification {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: unknown;
}

// Fetch notifications for a user
export const getNotificationsForUser = async (userId: string, limit = 20): Promise<QueryListResult<DbNotification>> => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};
