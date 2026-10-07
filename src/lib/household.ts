import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/lib/types";

export async function getCurrentHousehold(): Promise<{
  userId: string;
  household: Household | null;
  members: HouseholdMember[];
  me: HouseholdMember | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { userId: "", household: null, members: [], me: null };
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("*, households(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { userId: user.id, household: null, members: [], me: null };
  }

  const household = (membership as unknown as { households: Household }).households;

  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", household.id);

  const me = (members ?? []).find((m) => m.user_id === user.id) ?? null;

  return { userId: user.id, household, members: members ?? [], me };
}
