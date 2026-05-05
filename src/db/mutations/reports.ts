import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
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
  return withMutation(() => supabase.from("reports").insert(data));
}

/**
 * Update a report status (admin action)
 */
export async function updateReportStatus(
  reportId: string,
  status: string,
  adminNotes?: string | null
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("reports")
      .update({
        status,
        admin_notes: adminNotes || null,
      })
      .eq("id", reportId)
  );
}
