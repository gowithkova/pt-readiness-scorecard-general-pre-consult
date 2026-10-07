import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { createHousehold, joinHousehold } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { household } = await getCurrentHousehold();

  if (household) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Set up your workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new family workspace, or join one your co-parent already started.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-slate-900">Start a new family workspace</h2>
          <form action={createHousehold} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Your display name</label>
              <input
                name="displayName"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Workspace name</label>
              <input
                name="householdName"
                placeholder="The Smith Family"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create workspace
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-slate-900">Join with an invite code</h2>
          <form action={joinHousehold} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Your display name</label>
              <input
                name="displayName"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Invite code</label>
              <input
                name="inviteCode"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Join workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
