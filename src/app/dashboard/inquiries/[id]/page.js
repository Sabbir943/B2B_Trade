import { notFound } from "next/navigation";
import Link from "next/link";
import ThreadView from "@/components/thread-view";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getThread, markThreadRead, contactQuota } from "@/lib/inbox";
import { plain } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Conversation" };

/**
 * §7.4 thread detail — messages load once, opening the thread marks the
 * other side's messages read.
 */
export default async function ThreadPage({ params }) {
  const { id } = await params;
  const { user, tier } = await requirePermission("member.inquiries");

  const payload = await getThread(id, user.email);
  if (!payload) notFound();
  await markThreadRead(id, user.email);
  const quota = await contactQuota(user.email, tier);

  return (
    <>
      <WorkspaceHeader
        title="Conversation"
        description="Stay on-platform: replies, stages and contact reveals are all recorded here."
        actions={
          <Link href="/dashboard/inquiries" className="text-[13px] font-semibold text-primary hover:underline">
            ← All inquiries
          </Link>
        }
      />
      <ThreadView
        thread={plain(payload.thread)}
        messages={plain(payload.messages)}
        quota={plain(quota)}
        me={user.email}
        tierLabel={tier}
      />
    </>
  );
}
