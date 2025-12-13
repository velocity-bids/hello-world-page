import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

export interface CreateReportData {
  reporter_id: string;
  vehicle_id: string;
  reason: string;
  description?: string | null;
}

/**
 * Create a new report for a vehicle listing
 */
export async function createReport(data: CreateReportData): Promise<MutationResult> {
  try {
    const { error } = await supabase.from("reports").insert(data);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a report status (admin action)
 */
export async function updateReportStatus(
  reportId: string,
  status: string,
  adminNotes?: string | null
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        admin_notes: adminNotes || null,
      })
      .eq("id", reportId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
