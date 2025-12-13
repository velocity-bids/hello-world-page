import { supabase } from "@/integrations/supabase/client";
import type { QueryResult } from "./types";

// Check if user has admin role
export const checkUserIsAdmin = async (userId: string): Promise<QueryResult<boolean>> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null };
  } catch (error) {
    return { data: false, error: error as Error };
  }
};
