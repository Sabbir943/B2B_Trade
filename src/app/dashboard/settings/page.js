import SettingsForm from "@/components/settings-form";
import { SampleNote, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("member.settings");
  return (
    <>
      <WorkspaceHeader
        title="Settings"
        description="Preferences, notifications and account controls for your company workspace."
      />

      <SettingsForm />

      <SampleNote />
    </>
  );
}
