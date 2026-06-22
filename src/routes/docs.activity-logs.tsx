import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/activity-logs")({
  head: () => ({
    meta: [
      { title: "Activity logs — Beevr Docs" },
      { name: "description", content: "Every access key action in Beevr is logged. See exactly what was used, by whom, and when." },
    ],
  }),
  component: ActivityLogs,
});

function ActivityLogs() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Access & safety"
        title="Activity logs"
        lead="Every access key action is logged. Admins can see exactly what was accessed, what was built, and what was blocked."
      />

      <DocsSection title="What admins see">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Which key was used</li>
          <li>What data was accessed</li>
          <li>What tool was built</li>
          <li>What tests ran</li>
          <li>What was submitted for review</li>
          <li>What was blocked by safety policy</li>
        </ul>
      </DocsSection>

      <DocsSection>
        <Link
          to="/app/keys"
          className="clicky inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open access keys
        </Link>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/access-keys", label: "Access keys" },
          { to: "/docs/cli/opencode", label: "Connect OpenCode" },
          { to: "/docs/examples", label: "Examples" },
        ]}
      />
    </DocsShell>
  );
}
