"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const householdName = String(formData.get("householdName") ?? "Our Family");
  const displayName = String(formData.get("displayName") ?? "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household, error } = await supabase
    .from("households")
    .insert({ name: householdName, created_by: user!.id })
    .select()
    .single();

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: household!.id,
    user_id: user!.id,
    display_name: displayName || user!.email,
    color: "#2563eb",
  });

  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`);
  }

  redirect("/dashboard");
}

export async function joinHousehold(formData: FormData) {
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household, error } = await supabase
    .from("households")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error || !household) {
    redirect(`/onboarding?error=${encodeURIComponent("Invite code not found")}`);
  }

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: household!.id,
    user_id: user!.id,
    display_name: displayName || user!.email,
    color: "#16a34a",
  });

  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`);
  }

  redirect("/dashboard");
}
