import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { NavLink } from "./nav-link";
import { signOut } from "./actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/messages", label: "Messages" },
  { href: "/expenses", label: "Expenses" },
  { href: "/info-bank", label: "Info Bank" },
  { href: "/planning", label: "Planning" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { household, me } = await getCurrentHousehold();

  if (!household) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="mb-6 px-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Workspace</p>
          <p className="truncate font-semibold text-slate-900">{household!.name}</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="mb-3 flex items-center gap-2 px-2">
            <span
              className="h-6 w-6 rounded-full text-center text-xs font-semibold leading-6 text-white"
              style={{ backgroundColor: me?.color ?? "#64748b" }}
            >
              {(me?.display_name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate text-sm text-slate-700">{me?.display_name}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
