import { getCurrentHousehold } from "@/lib/household";
import { renameHousehold, updateMyProfile } from "./actions";

export default async function SettingsPage() {
  const { household, members, me } = await getCurrentHousehold();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your workspace and invite your co-parent.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Invite your co-parent</h2>
        <p className="text-sm text-slate-500">
          Share this code — they can enter it on the &quot;Join with an invite code&quot; screen after creating an account.
        </p>
        <p className="mt-3 inline-block rounded-lg bg-slate-100 px-4 py-2 font-mono text-lg tracking-widest text-slate-800">
          {household!.invite_code}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Workspace name</h2>
        <form action={renameHousehold} className="flex gap-3">
          <input name="name" defaultValue={household!.name} required className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Your profile</h2>
        <form action={updateMyProfile} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Display name</label>
            <input name="displayName" defaultValue={me?.display_name} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Color</label>
            <input name="color" type="color" defaultValue={me?.color} className="mt-1 h-10 w-16 rounded-lg border border-slate-300" />
          </div>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-sm">
              <span className="h-6 w-6 rounded-full text-center text-xs font-semibold leading-6 text-white" style={{ backgroundColor: m.color }}>
                {m.display_name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-slate-700">{m.display_name}</span>
              <span className="text-xs uppercase tracking-wide text-slate-400">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
