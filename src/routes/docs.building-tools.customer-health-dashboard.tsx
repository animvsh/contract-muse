import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/building-tools/customer-health-dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Health Dashboard — Beevr Docs" },
      {
        name: "description",
        content: "Walk through building a customer health dashboard tool on top of Beevr with OpenCode.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Guide"
        title="Build a Customer Health Dashboard"
        lead="A worked example: from access key to installed tool, using OpenCode and approved support context."
      />

      <DocsSection title="What it shows">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Health score and risk level</li>
          <li>Open complaints and unresolved promises</li>
          <li>Recommended next actions</li>
          <li>Source-backed context for every signal</li>
        </ul>
      </DocsSection>

      <DocsSection title="Build it">
        <StepList
          steps={[
            "Create an OpenCode access key scoped to the Support team.",
            "Choose Build in sandbox so OpenCode can draft without live changes.",
            "Copy the OpenCode setup block and paste it into OpenCode.",
            "Ask OpenCode to build the dashboard.",
            "OpenCode plans the tool using approved Beevr context.",
            "OpenCode submits the finished tool to Beevr.",
            "Admin reviews requested access and approves.",
            "Tool appears in the Support workspace.",
          ]}
        />
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/cli/opencode", label: "OpenCode setup" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/examples", label: "More examples" },
          { to: "/docs/agents", label: "Build an agent" },
        ]}
      />
    </DocsShell>
  );
}
