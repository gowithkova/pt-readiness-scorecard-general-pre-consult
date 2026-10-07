import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Expense, ExpenseShare } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { createExpense, markSharePaid, deleteExpense } from "./actions";

export default async function ExpensesPage() {
  const { household, members, me } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("household_id", household!.id)
    .order("incurred_on", { ascending: false });

  const expenseIds = (expenses ?? []).map((e) => e.id);
  const { data: shares } = expenseIds.length
    ? await supabase.from("expense_shares").select("*").in("expense_id", expenseIds)
    : { data: [] as ExpenseShare[] };

  const nameFor = (id: string) => members.find((m) => m.id === id)?.display_name ?? "Unknown";

  const totalOwedToMe = (shares ?? []).filter(
    (s) => s.status === "owed" && (expenses ?? []).find((e) => e.id === s.expense_id)?.paid_by_member_id === me?.id
  ).reduce((sum, s) => sum + s.share_cents, 0);

  const totalIOwe = (shares ?? []).filter((s) => s.status === "owed" && s.member_id === me?.id).reduce((sum, s) => sum + s.share_cents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Expenses</h1>
        <p className="text-sm text-slate-500">Log shared child expenses and track who owes what.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Owed to you</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatCents(totalOwedToMe)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">You owe</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{formatCents(totalIOwe)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Log an expense</h2>
        <form action={createExpense} className="grid gap-3 sm:grid-cols-2">
          <input name="description" placeholder="Description" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="category" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="medical">Medical</option>
            <option value="school">School</option>
            <option value="activity">Activity</option>
            <option value="clothing">Clothing</option>
            <option value="childcare">Childcare</option>
            <option value="other">Other</option>
          </select>
          <select name="paidByMemberId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Paid by…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
          <input name="incurredOn" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:col-span-2">
            Add expense (split evenly among {members.length} member{members.length === 1 ? "" : "s"})
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {(expenses as Expense[] | null)?.length ? (
          (expenses as Expense[]).map((expense) => {
            const expenseShares = (shares ?? []).filter((s) => s.expense_id === expense.id);
            return (
              <div key={expense.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{expense.description}</p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(expense.incurred_on), "MMM d, yyyy")} · {expense.category} · paid by {nameFor(expense.paid_by_member_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-900">{formatCents(expense.amount_cents)}</p>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {expenseShares.map((share) => (
                    <li key={share.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{nameFor(share.member_id)}</span>
                      <span className="flex items-center gap-2">
                        <span className={share.status === "paid" ? "text-emerald-600" : "text-slate-500"}>
                          {formatCents(share.share_cents)} · {share.status}
                        </span>
                        {share.status === "owed" && (
                          <form action={markSharePaid}>
                            <input type="hidden" name="id" value={share.id} />
                            <button type="submit" className="text-xs text-blue-600 hover:underline">
                              Mark paid
                            </button>
                          </form>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-400">No expenses logged yet.</p>
        )}
      </section>
    </div>
  );
}
