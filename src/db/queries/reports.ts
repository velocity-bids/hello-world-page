import { supabase } from "@/integrations/supabase/client";

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

export async function updateReportStatus(
  reportId: string,
  status: string,
  adminNotes?: string
) {
  const { data, error } = await supabase
    .from("reports")
    .update({
      status,
      admin_notes: adminNotes || null,
    })
    .eq("id", reportId)
    .select()
    .single();

  return { data: data as Report | null, error };
}
