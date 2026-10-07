"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function renameHousehold(formData: FormData) {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("households").update({ name }).eq("id", household.id);
  revalidatePath("/settings");
}

export async function updateMyProfile(formData: FormData) {
  const { me } = await getCurrentHousehold();
  if (!me) return;

  const displayName = String(formData.get("displayName") ?? "").trim();
  const color = String(formData.get("color") ?? me.color);

  const supabase = await createClient();
  await supabase.from("household_members").update({ display_name: displayName || me.display_name, color }).eq("id", me.id);
  revalidatePath("/settings");
}
