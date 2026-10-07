"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { dollarsToCents } from "@/lib/money";

export async function createExpense(formData: FormData) {
  const { household, userId, members } = await getCurrentHousehold();
  if (!household) return;

  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "other");
  const amount = String(formData.get("amount") ?? "0");
  const paidByMemberId = String(formData.get("paidByMemberId") ?? "");
  const incurredOn = String(formData.get("incurredOn") ?? new Date().toISOString().slice(0, 10));

  const amountCents = dollarsToCents(amount);
  if (amountCents <= 0 || !paidByMemberId || members.length === 0) return;

  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      household_id: household.id,
      created_by: userId,
      description,
      category,
      amount_cents: amountCents,
      paid_by_member_id: paidByMemberId,
      incurred_on: incurredOn,
    })
    .select()
    .single();

  if (error || !expense) return;

  const shareCents = Math.floor(amountCents / members.length);
  const remainder = amountCents - shareCents * members.length;

  const shares = members.map((member, idx) => ({
    expense_id: expense.id,
    member_id: member.id,
    share_cents: shareCents + (idx === 0 ? remainder : 0),
    status: member.id === paidByMemberId ? ("paid" as const) : ("owed" as const),
    paid_at: member.id === paidByMemberId ? new Date().toISOString() : null,
  }));

  await supabase.from("expense_shares").insert(shares);
  revalidatePath("/expenses");
}

export async function markSharePaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("expense_shares").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/expenses");
}
