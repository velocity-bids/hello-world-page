import { supabase } from "@/integrations/supabase/client";
import { withQuery } from "../helpers";
import type { QueryResult } from "./types";

// Check if user has admin role
export const checkUserIsAdmin = async (userId: string): Promise<QueryResult<boolean>> => {
  const result = await withQuery(async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return { data: !!data, error };
  });

  return result.error ? { data: false, error: result.error } : result;
};
