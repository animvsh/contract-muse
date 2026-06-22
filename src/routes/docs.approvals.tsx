import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — Beevr Docs" },
      { name: "description", content: "How Beevr protects workspaces with explicit approval for risky actions." },
    ],
  }),
  component: Approvals,
});

function Approvals() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Access & safety"
        title="Approvals"
        lead="Beevr protects workspaces by requiring explicit admin approval before risky changes go live."
      />

      <DocsSection title="What requires approval">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Installing tools</li>
          <li>Activating agents</li>
          <li>Sending external messages</li>
          <li>Changing permissions</li>
          <li>Accessing restricted data</li>
          <li>Making live workspace changes</li>
        </ul>
      </DocsSection>

      <DocsSection title="Example approval">
        <div className="rounded-xl border border-border bg-card p-5 text-sm">
          <div className="font-semibold">OpenCode submitted: Customer Health Dashboard</div>
          <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Requested access</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            <li>Support KB</li>
            <li>Customer summaries</li>
            <li>Complaint reports</li>
          </ul>
          <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Risk</div>
          <div>Read-only</div>
          <div className="mt-4 flex gap-2">
            <Link
              to="/app/approvals"
              className="clicky rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open approvals
            </Link>
            <button className="clicky rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              Ask for changes
            </button>
          </div>
        </div>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/activity-logs", label: "Activity logs" },
          { to: "/docs/access-keys", label: "Access keys" },
          { to: "/docs/building-tools", label: "Building tools" },
          { to: "/docs/agents", label: "Agents" },
        ]}
      />
    </DocsShell>
  );
}
