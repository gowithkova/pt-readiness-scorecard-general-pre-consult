import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { PlanNote } from "@/lib/types";
import { createPlanNote, updatePlanNoteStatus, deletePlanNote } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default async function PlanningPage() {
  const { household, members } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("plan_notes")
    .select("*")
    .eq("household_id", household!.id)
    .order("created_at", { ascending: false });

  const nameFor = (userId: string) => members.find((m) => m.user_id === userId)?.display_name ?? "Someone";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Planning</h1>
        <p className="text-sm text-slate-500">
          Longer-term parenting plan items, decisions to make, and goals to track together.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Add a planning item</h2>
        <form action={createPlanNote} className="grid gap-3 sm:grid-cols-2">
          <input name="title" placeholder="Title (e.g. Summer camp decision)" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <textarea name="body" placeholder="Details, options to consider, who's doing what…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" rows={3} />
          <input name="targetDate" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add item
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {(notes as PlanNote[] | null)?.length ? (
          (notes as PlanNote[]).map((note) => (
            <div key={note.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{note.title}</p>
                  <p className="text-xs text-slate-500">
                    Added by {nameFor(note.created_by)}
                    {note.target_date && ` · Target: ${format(parseISO(note.target_date), "MMM d, yyyy")}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[note.status]}`}>
                  {note.status.replace("_", " ")}
                </span>
              </div>
              {note.body && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{note.body}</p>}
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                {["open", "in_progress", "resolved"].map((status) => (
                  <form key={status} action={updatePlanNoteStatus}>
                    <input type="hidden" name="id" value={note.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={note.status === status}
                      className="text-xs font-medium text-blue-600 hover:underline disabled:text-slate-300 disabled:no-underline"
                    >
                      Mark {status.replace("_", " ")}
                    </button>
                  </form>
                ))}
                <form action={deletePlanNote} className="ml-auto">
                  <input type="hidden" name="id" value={note.id} />
                  <button type="submit" className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No planning items yet.</p>
        )}
      </section>
    </div>
  );
}
