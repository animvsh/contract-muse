import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

const FLOW = [
  "Describe the tool",
  "Beevr checks allowed workspace access",
  "CLI builds in sandbox",
  "Tests run against simulated data",
  "Tool submitted for review",
  "Admin approves",
  "Tool installed and surfaced in Beevr",
];

export const Route = createFileRoute("/docs/building-tools")({
  head: () => ({
    meta: [
      { title: "Building tools — Beevr Docs" },
      { name: "description", content: "How builders create tools on top of Beevr — sandbox, tests, approval, install." },
    ],
  }),
  component: BuildingTools,
});

function BuildingTools() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Building on Beevr"
        title="Building tools"
        lead="A Beevr tool is a reusable capability that can appear in Brain chat, team spaces, the agent builder, and approved CLI workflows."
      />

      <DocsSection title="The flow">
        <ol className="space-y-2 text-sm">
          {FLOW.map((s, i) => (
            <li key={i} className="rounded-lg border border-border bg-card px-4 py-3">
              <span className="mr-2 text-xs font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
              {s}
            </li>
          ))}
        </ol>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/building-tools/customer-health-dashboard", label: "Example: Customer health dashboard" },
          { to: "/docs/agents", label: "Build an agent" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/examples", label: "More examples" },
        ]}
      />
    </DocsShell>
  );
}
