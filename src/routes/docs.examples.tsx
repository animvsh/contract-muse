import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

const EXAMPLES = [
  {
    title: "Customer Health Dashboard",
    what: "Health score, risks, open complaints, recommended actions.",
    access: "Support docs (read), customer summaries (read).",
    cli: "OpenCode in sandbox.",
  },
  {
    title: "Support Reply Drafter",
    what: "Drafts reply suggestions for inbound support tickets.",
    access: "Support KB (read), ticket samples (read).",
    cli: "Claude Code in sandbox.",
  },
  {
    title: "Sales Call Brief Generator",
    what: "Generates pre-call briefs from CRM and notes.",
    access: "CRM accounts (read), meeting notes (read).",
    cli: "OpenCode in sandbox.",
  },
  {
    title: "Complaint Watchdog Agent",
    what: "Monitors signals and flags emerging complaints.",
    access: "Tickets (read), Slack #support (read).",
    cli: "Custom CLI, run-approved agents only.",
  },
  {
    title: "Internal Search Assistant",
    what: "Workspace-aware search inside an internal app.",
    access: "All approved docs (read).",
    cli: "Internal app key, read-only.",
  },
  {
    title: "Weekly Team Summary Runner",
    what: "Triggers and posts a weekly summary agent.",
    access: "Run approved agent: Weekly Summary.",
    cli: "Cursor or scheduled job.",
  },
];

export const Route = createFileRoute("/docs/examples")({
  head: () => ({
    meta: [
      { title: "Examples — Beevr Docs" },
      { name: "description", content: "Ready-to-use examples for tools and agents you can build on Beevr." },
    ],
  }),
  component: Examples,
});

function Examples() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Examples"
        title="Example library"
        lead="Concrete tools and agents you can build today. Each one lists what it does, what access it needs, and which CLI to use."
      />

      <DocsSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EXAMPLES.map((e) => (
            <div key={e.title} className="rounded-xl border border-border bg-card p-5">
              <div className="font-semibold">{e.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{e.what}</p>
              <div className="mt-3 grid gap-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Access: </span>
                  {e.access}
                </div>
                <div>
                  <span className="text-muted-foreground">CLI: </span>
                  {e.cli}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/quickstart", label: "Quickstart" },
          { to: "/docs/building-tools", label: "Building tools" },
          { to: "/docs/agents", label: "Agents" },
          { to: "/docs/approvals", label: "Approval flow" },
        ]}
      />
    </DocsShell>
  );
}
