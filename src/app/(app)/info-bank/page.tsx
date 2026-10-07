import Link from "next/link";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Child, Contact, Document as FamilyDocument } from "@/lib/types";
import {
  createContact,
  deleteContact,
  createChild,
  deleteChild,
  uploadDocument,
  deleteDocument,
  getDocumentUrl,
} from "./actions";

const TABS = [
  { key: "contacts", label: "Contacts" },
  { key: "children", label: "Children" },
  { key: "documents", label: "Documents" },
];

export default async function InfoBankPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "contacts" } = await searchParams;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [{ data: contacts }, { data: children }, { data: documents }] = await Promise.all([
    supabase.from("contacts").select("*").eq("household_id", household!.id).order("name"),
    supabase.from("children").select("*").eq("household_id", household!.id).order("full_name"),
    supabase.from("documents").select("*").eq("household_id", household!.id).order("created_at", { ascending: false }),
  ]);

  const documentLinks = await Promise.all(
    ((documents ?? []) as FamilyDocument[]).map(async (doc) => ({
      doc,
      url: await getDocumentUrl(doc.storage_path),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Info Bank</h1>
        <p className="text-sm text-slate-500">Contacts, children&apos;s details, and important documents in one place.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/info-bank?tab=${t.key}`}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "contacts" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-medium text-slate-900">Add a contact</h2>
            <form action={createContact} className="space-y-3">
              <input name="name" placeholder="Name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select name="role" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="doctor">Doctor</option>
                <option value="school">School</option>
                <option value="emergency">Emergency</option>
                <option value="caregiver">Caregiver</option>
                <option value="other">Other</option>
              </select>
              <input name="phone" placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Notes" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add contact
              </button>
            </form>
          </section>

          <section className="space-y-3">
            {(contacts as Contact[] | null)?.length ? (
              (contacts as Contact[]).map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{c.role}</p>
                    </div>
                    <form action={deleteContact}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                    </form>
                  </div>
                  {c.phone && <p className="mt-1 text-sm text-slate-600">{c.phone}</p>}
                  {c.email && <p className="text-sm text-slate-600">{c.email}</p>}
                  {c.notes && <p className="mt-1 text-sm text-slate-500">{c.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No contacts saved yet.</p>
            )}
          </section>
        </div>
      )}

      {tab === "children" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-medium text-slate-900">Add a child</h2>
            <form action={createChild} className="space-y-3">
              <input name="fullName" placeholder="Full name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="dateOfBirth" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Allergies, school, medical notes…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add child
              </button>
            </form>
          </section>

          <section className="space-y-3">
            {(children as Child[] | null)?.length ? (
              (children as Child[]).map((child) => (
                <div key={child.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{child.full_name}</p>
                      {child.date_of_birth && (
                        <p className="text-xs text-slate-500">Born {format(parseISO(child.date_of_birth), "MMM d, yyyy")}</p>
                      )}
                    </div>
                    <form action={deleteChild}>
                      <input type="hidden" name="id" value={child.id} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                    </form>
                  </div>
                  {child.notes && <p className="mt-1 text-sm text-slate-500">{child.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No children added yet.</p>
            )}
          </section>
        </div>
      )}

      {tab === "documents" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-medium text-slate-900">Upload a document</h2>
            <form action={uploadDocument} className="space-y-3">
              <input name="title" placeholder="Title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select name="category" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="legal">Legal</option>
                <option value="medical">Medical</option>
                <option value="school">School</option>
                <option value="other">Other</option>
              </select>
              <input name="file" type="file" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Upload
              </button>
              <p className="text-xs text-slate-400">
                Requires a &quot;documents&quot; storage bucket in Supabase (see README).
              </p>
            </form>
          </section>

          <section className="space-y-3">
            {documentLinks.length ? (
              documentLinks.map(({ doc, url }) => (
                <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{doc.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{doc.category}</p>
                    </div>
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={doc.id} />
                      <input type="hidden" name="path" value={doc.storage_path} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                    </form>
                  </div>
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-blue-600 hover:underline">
                      Open document
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No documents uploaded yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
