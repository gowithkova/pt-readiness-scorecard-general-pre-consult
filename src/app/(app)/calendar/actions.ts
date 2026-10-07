"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createEvent(formData: FormData) {
  const { household, userId } = await getCurrentHousehold();
  if (!household) return;

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "general");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "00:00");
  const endTime = String(formData.get("endTime") ?? "23:59");
  const allDay = formData.get("allDay") === "on";
  const responsibleMemberId = String(formData.get("responsibleMemberId") ?? "") || null;

  const startAt = new Date(`${date}T${allDay ? "00:00" : startTime}`);
  const endAt = new Date(`${date}T${allDay ? "23:59" : endTime}`);

  const supabase = await createClient();
  await supabase.from("events").insert({
    household_id: household.id,
    created_by: userId,
    title,
    description,
    category,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    all_day: allDay,
    responsible_member_id: responsibleMemberId,
  });

  revalidatePath("/calendar");
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/calendar");
}
