"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createPlanNote(formData: FormData) {
  const { household, userId } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("plan_notes").insert({
    household_id: household.id,
    created_by: userId,
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    target_date: String(formData.get("targetDate") ?? "") || null,
  });

  revalidatePath("/planning");
}

export async function updatePlanNoteStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "open");
  const supabase = await createClient();
  await supabase.from("plan_notes").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/planning");
}

export async function deletePlanNote(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("plan_notes").delete().eq("id", id);
  revalidatePath("/planning");
}
