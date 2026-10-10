import RequirementsWorkspace from "@/components/requirements-workspace";
import { Button } from "@/components/ui";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import {
  getRequirementsByBuyer,
  quoteCountByRequirement,
  ensureSourcingEscalation,
} from "@/lib/requirements";
import { getThreadsFor } from "@/lib/inbox";
import { plain } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "My requirements" };

/**
 * §7.3 buyer side — real posts with quote counts, award/close/review
 * actions and the 72h no-quote Sourcing Desk escalation (idempotent on
 * every view).
 */
export default async function RequirementsPage() {
  const { user } = await requirePermission("member.requirements");

  const posts = await getRequirementsByBuyer(user.email);
  const counts = await quoteCountByRequirement(posts.map((row) => row.id));

  // Idempotent: raises the Sourcing Desk request for any published post
  // that has been live 72h with zero quotes (§7.3.5).
  for (const post of posts) {
    if (post.status === "published") await ensureSourcingEscalation(post);
  }

  const threads = await getThreadsFor(user.email);
  const quoterMap = {};
  for (const thread of threads) {
    if (!thread.requirementId) continue;
    const list = quoterMap[thread.requirementId] || (quoterMap[thread.requirementId] = []);
    if (thread.counterpart && !list.some((item) => item.email === thread.counterpart)) {
      list.push({ email: thread.counterpart, name: thread.counterpartName });
    }
  }

  const rows = posts.map((post) => ({ ...post, quotes: counts.get(post.id) || 0 }));

  return (
    <>
      <WorkspaceHeader
        title="My requirements"
        description="Posts you have published on the buy board. Compare quotes, shortlist suppliers and award when ready."
        actions={
          <Button href="/rfq" variant="accent" size="sm">
            Post Your Requirement
          </Button>
        }
      />

      <RequirementsWorkspace posts={plain(rows)} quoterMap={plain(quoterMap)} />
    </>
  );
}
