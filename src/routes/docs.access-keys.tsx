import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/access-keys")({
  head: () => ({
    meta: [
      { title: "Access keys — Beevr Docs" },
      { name: "description", content: "How Beevr access keys give CLIs safe, scoped access to your workspace." },
    ],
  }),
  component: AccessKeys,
});

const EXAMPLES = [
  {
    name: "OpenCode Support Builder",
    access: "Support docs + sandbox builds",
    use: "Lets OpenCode draft new support tools without touching live data.",
  },
  {
    name: "Cursor Docs Helper",
    access: "Read-only workspace docs",
    use: "Cursor can search company docs while you code.",
  },
  {
    name: "Internal Dashboard Key",
    access: "Run approved reporting agents",
    use: "Powers internal dashboards with live workspace metrics.",
  },
];

function AccessKeys() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Concept"
        title="Access keys"
        lead="An access key lets a CLI, coding agent, or internal app interact with a Beevr workspace — with explicit, reviewable permissions."
      />

      <DocsSection title="What an access key controls">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>What knowledge the tool can read</li>
          <li>What actions it can perform</li>
          <li>Whether it can build in sandbox</li>
          <li>Whether it can run approved agents</li>
          <li>Whether changes need approval before going live</li>
        </ul>
      </DocsSection>

      <DocsSection title="Example keys">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {EXAMPLES.map((e) => (
            <div key={e.name} className="rounded-xl border border-border bg-card p-4">
              <div className="font-semibold">{e.name}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-primary">{e.access}</div>
              <p className="mt-2 text-sm text-muted-foreground">{e.use}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection title="Create your first key">
        <p className="text-sm text-muted-foreground">
          Open the Access Keys page in Beevr to create, scope, and copy setup for any CLI.
        </p>
        <Link
          to="/app/keys"
          className="clicky mt-2 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open access keys
        </Link>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/cli/opencode", label: "Connect OpenCode" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/activity-logs", label: "Activity logs" },
          { to: "/docs/building-tools", label: "Building tools" },
        ]}
      />
    </DocsShell>
  );
}
