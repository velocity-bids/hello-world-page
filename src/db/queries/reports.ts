import { supabase } from "@/integrations/supabase/client";

/**
 * Report type for query results
 * Note: Mutations are in src/db/mutations/reports.ts
 */
export interface Report {
  id: string;
  reporter_id: string;
  vehicle_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch reports with optional status filter
 */
export async function getReports(status?: string) {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  return { data: data as Report[] | null, error };
}
