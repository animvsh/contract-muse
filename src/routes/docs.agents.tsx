import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Beevr Docs" },
      { name: "description", content: "List, run, and create Beevr agents from a CLI with the right access key." },
    ],
  }),
  component: Agents,
});

function Agents() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Building on Beevr"
        title="Agents"
        lead="Agents are Beevr workflows that perform repeated tasks. With the right access key, a CLI can list, run, and create them."
      />

      <DocsSection title="What a CLI can do">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>List approved agents</li>
          <li>Run approved agents</li>
          <li>Check run status and inspect output</li>
          <li>Create agent drafts</li>
          <li>Submit agent changes for review</li>
        </ul>
      </DocsSection>

      <DocsSection title="Common workflows">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { t: "Run Weekly Support Summary", d: "Trigger an existing approved agent and stream output." },
            { t: "Create Complaint Watchdog", d: "Draft a new agent that monitors and flags risks." },
            { t: "Debug failed agent run", d: "Inspect logs and retry steps from your CLI." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-4">
              <div className="font-semibold">{c.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/building-tools", label: "Building tools" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/access-keys", label: "Access keys" },
          { to: "/docs/examples", label: "Examples" },
        ]}
      />
    </DocsShell>
  );
}
