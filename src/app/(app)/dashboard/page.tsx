import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { CalendarEvent, ExpenseShare, Message } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { format } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { household, members, me } = await getCurrentHousehold();

  const [{ data: events }, { data: messages }, { data: shares }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("household_id", household!.id)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5),
    supabase
      .from("messages")
      .select("*")
      .eq("household_id", household!.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("expense_shares")
      .select("*, expenses!inner(household_id)")
      .eq("expenses.household_id", household!.id)
      .eq("status", "owed"),
  ]);

  const myOwed = ((shares ?? []) as (ExpenseShare & { member_id: string })[])
    .filter((s) => s.member_id === me?.id)
    .reduce((sum, s) => sum + s.share_cents, 0);

  const nameFor = (userId: string) =>
    members.find((m) => m.user_id === userId)?.display_name ?? "Someone";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back{me ? `, ${me.display_name}` : ""}
        </h1>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s going on in {household!.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Upcoming events</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{events?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">You currently owe</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCents(myOwed)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Household members</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{members.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Upcoming</h2>
            <Link href="/calendar" className="text-sm text-blue-600 hover:underline">
              View calendar
            </Link>
          </div>
          <ul className="space-y-3">
            {(events as CalendarEvent[] | null)?.length ? (
              (events as CalendarEvent[]).map((e) => (
                <li key={e.id} className="flex items-start justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{e.title}</p>
                    <p className="text-slate-500">{format(new Date(e.start_at), "EEE, MMM d · h:mm a")}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {e.category}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-400">Nothing scheduled yet.</p>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Recent messages</h2>
            <Link href="/messages" className="text-sm text-blue-600 hover:underline">
              Open messages
            </Link>
          </div>
          <ul className="space-y-3">
            {(messages as Message[] | null)?.length ? (
              (messages as Message[]).map((m) => (
                <li key={m.id} className="text-sm">
                  <p className="font-medium text-slate-800">{nameFor(m.sender_id)}</p>
                  <p className="truncate text-slate-500">{m.body}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-400">No messages yet.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
