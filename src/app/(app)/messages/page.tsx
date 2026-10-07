import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Message } from "@/lib/types";
import { MessageThread } from "./message-thread";

export default async function MessagesPage() {
  const { household, members, userId } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("household_id", household!.id)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500">A shared, kept-on-record thread between co-parents.</p>
      </div>
      <MessageThread
        householdId={household!.id}
        initialMessages={(messages ?? []) as Message[]}
        members={members}
        currentUserId={userId}
      />
    </div>
  );
}
