import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { CalendarEvent } from "@/lib/types";
import { createEvent, deleteEvent } from "./actions";

const CATEGORY_COLORS: Record<string, string> = {
  custody: "bg-purple-100 text-purple-700",
  school: "bg-amber-100 text-amber-700",
  medical: "bg-red-100 text-red-700",
  activity: "bg-emerald-100 text-emerald-700",
  general: "bg-slate-100 text-slate-700",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const anchor = month ? parseISO(`${month}-01`) : new Date();

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { household, members } = await getCurrentHousehold();
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("household_id", household!.id)
    .gte("start_at", gridStart.toISOString())
    .lte("start_at", gridEnd.toISOString())
    .order("start_at", { ascending: true });

  const eventsByDay = (day: Date) =>
    ((events ?? []) as CalendarEvent[]).filter((e) => isSameDay(parseISO(e.start_at), day));

  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  const nameFor = (id: string | null) => members.find((m) => m.id === id)?.display_name ?? "Unassigned";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{format(monthStart, "MMMM yyyy")}</h1>
        <div className="flex gap-2">
          <Link
            href={`/calendar?month=${prevMonth}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            ← Prev
          </Link>
          <Link
            href={`/calendar?month=${nextMonth}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = eventsByDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[96px] bg-white p-1.5 ${
                !isSameMonth(day, monthStart) ? "bg-slate-50 text-slate-400" : ""
              }`}
            >
              <p className="mb-1 text-right text-xs">{format(day, "d")}</p>
              <div className="space-y-1">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded px-1.5 py-0.5 text-[11px] ${CATEGORY_COLORS[e.category]}`}
                    title={`${e.title} — ${nameFor(e.responsible_member_id)}`}
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-medium text-slate-900">Add an event</h2>
          <form action={createEvent} className="space-y-3">
            <input
              name="title"
              placeholder="Title"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              placeholder="Notes (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="date"
                type="date"
                required
                defaultValue={format(new Date(), "yyyy-MM-dd")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select name="category" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="general">General</option>
                <option value="custody">Custody</option>
                <option value="school">School</option>
                <option value="medical">Medical</option>
                <option value="activity">Activity</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="startTime" type="time" defaultValue="09:00" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="endTime" type="time" defaultValue="10:00" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="allDay" /> All day
            </label>
            <select name="responsibleMemberId" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Responsible parent (optional)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add event
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-medium text-slate-900">This month&apos;s events</h2>
          <ul className="space-y-2">
            {((events ?? []) as CalendarEvent[]).map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {format(parseISO(e.start_at), "MMM d, h:mm a")} · {nameFor(e.responsible_member_id)}
                  </p>
                </div>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {!(events ?? []).length && <p className="text-sm text-slate-400">No events this month.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
