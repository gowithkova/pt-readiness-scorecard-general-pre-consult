"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createContact(formData: FormData) {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("contacts").insert({
    household_id: household.id,
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "other"),
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });

  revalidatePath("/info-bank");
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/info-bank");
}

export async function createChild(formData: FormData) {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("children").insert({
    household_id: household.id,
    full_name: String(formData.get("fullName") ?? ""),
    date_of_birth: String(formData.get("dateOfBirth") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });

  revalidatePath("/info-bank");
}

export async function deleteChild(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("children").delete().eq("id", id);
  revalidatePath("/info-bank");
}

export async function uploadDocument(formData: FormData) {
  const { household, userId } = await getCurrentHousehold();
  if (!household) return;

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "");
  const category = String(formData.get("category") ?? "other");
  if (!file || file.size === 0) return;

  const supabase = await createClient();
  const path = `${household.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
  if (uploadError) return;

  await supabase.from("documents").insert({
    household_id: household.id,
    uploaded_by: userId,
    title: title || file.name,
    storage_path: path,
    category,
  });

  revalidatePath("/info-bank");
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");
  const supabase = await createClient();
  await supabase.storage.from("documents").remove([path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/info-bank");
}

export async function getDocumentUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
