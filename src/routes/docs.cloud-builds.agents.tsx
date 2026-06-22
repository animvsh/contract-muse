import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/cloud-builds/agents")({
  head: () => ({
    meta: [
      { title: "Build agents in cloud — Beevr Docs" },
      { name: "description", content: "Turn a plain-English description into a tested, hosted Beevr agent." },
    ],
  }),
  component: CloudAgents,
});

function CloudAgents() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Cloud Builds"
        title="Build agents in cloud"
        lead="Describe what you want the agent to do. Beevr handles data discovery, mapping, tests, hosting, and scheduling."
      />

      <DocsSection title="What Beevr infers from your request">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Workspace context (e.g. bookstore, SaaS, agency)</li>
          <li>Goal — reporting, drafting, monitoring, routing</li>
          <li>Required data sources</li>
          <li>Output shape — text summary, dashboard, email</li>
          <li>Schedule — daily, weekly, on-event</li>
          <li>Risk — read-only vs. live actions</li>
        </ul>
      </DocsSection>

      <DocsSection title="Build steps">
        <StepList
          steps={[
            "From Home, describe the agent you want.",
            "Beevr proposes a plan with sources, schedule, and output.",
            "Click Build in Cloud — Beevr maps data and runs tests.",
            "Review the preview output and tweak via chat.",
            "Activate. Beevr hosts the agent and starts the schedule.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Safety defaults">
        <p className="text-sm">
          Cloud agents are read-only by default. Anything that sends external messages, modifies data, or
          touches restricted sources requires explicit approval before going live.
        </p>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/examples/bookstore-sales-agent", label: "Worked example: bookstore sales agent" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/agents", label: "Manage agents from a CLI" },
          { to: "/docs/cloud-builds", label: "Cloud builds overview" },
        ]}
      />
    </DocsShell>
  );
}
