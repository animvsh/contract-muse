import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, DocsCard, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/cloud-builds")({
  head: () => ({
    meta: [
      { title: "Cloud builds — Beevr Docs" },
      { name: "description", content: "Build agents, tools, dashboards, and APIs in the Beevr cloud — no infra to manage." },
    ],
  }),
  component: CloudBuilds,
});

function CloudBuilds() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Cloud Builds"
        title="Build in the cloud"
        lead="Describe what you want. Beevr plans it, builds it, tests it, and hosts it. You review, then activate."
      />

      <DocsSection title="The default flow">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Describe the agent, tool, dashboard, or API you want.</li>
          <li>Beevr drafts a plan from your workspace context.</li>
          <li>Click <span className="font-semibold">Build in Cloud</span>.</li>
          <li>Beevr reads data, maps fields, and runs tests.</li>
          <li>You review the preview output.</li>
          <li>You activate. Beevr hosts and runs it.</li>
        </ol>
      </DocsSection>

      <DocsSection title="What you can build">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DocsCard to="/docs/cloud-builds/agents" title="Agents" description="Recurring workflows like daily summaries or watchdogs." />
          <DocsCard to="/docs/building-tools" title="Tools" description="Reusable capabilities surfaced in chat and team spaces." />
          <DocsCard to="/docs/examples" title="Dashboards & APIs" description="Internal dashboards and endpoints powered by workspace data." />
          <DocsCard to="/docs/approvals" title="Safety & approvals" description="How risky actions are gated before going live." />
        </div>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/cloud-builds/agents", label: "Build an agent in cloud" },
          { to: "/docs/examples/bookstore-sales-agent", label: "Example: bookstore sales agent" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/quickstart", label: "Quickstart" },
        ]}
      />
    </DocsShell>
  );
}
