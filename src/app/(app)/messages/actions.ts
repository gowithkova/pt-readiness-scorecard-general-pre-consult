"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function sendMessage(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { household, userId } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("messages").insert({
    household_id: household.id,
    sender_id: userId,
    body,
  });

  revalidatePath("/messages");
}
