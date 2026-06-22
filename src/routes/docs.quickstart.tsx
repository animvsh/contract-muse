import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, CopyBlock, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/quickstart")({
  head: () => ({
    meta: [
      { title: "Quickstart — Beevr Docs" },
      { name: "description", content: "Ship your first Beevr-powered tool in five minutes." },
    ],
  }),
  component: Quickstart,
});

function Quickstart() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Getting started"
        title="Quickstart"
        lead="Create an access key, connect a CLI, and ship your first tool — in under five minutes."
      />

      <DocsSection title="The flow">
        <StepList
          steps={[
            "In Beevr, go to Access Keys and click Create access key.",
            "Pick a CLI (OpenCode, Claude Code, Cursor) and a workspace scope (e.g. Support team).",
            "Choose Build in sandbox so the CLI can draft tools without making live changes.",
            "Copy the generated setup and paste it into your CLI session.",
            "Ask the CLI to build something — e.g. a customer health dashboard.",
            "Review the submitted tool in Beevr Approvals.",
            "Approve and install. The tool now appears in your workspace.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Example prompt">
        <CopyBlock
          label="Prompt for your CLI"
          code={`Build a customer health dashboard using approved Beevr support context.

Use the Beevr access key to:
1. List allowed knowledge sources and actions.
2. Plan the tool.
3. Build it in sandbox.
4. Run tests.
5. Submit it to Beevr for review.

Do not make any live workspace changes.`}
        />
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/access-keys", label: "Learn about access keys" },
          { to: "/docs/cli/opencode", label: "Connect OpenCode" },
          { to: "/docs/building-tools", label: "Build your first tool" },
          { to: "/docs/approvals", label: "Understand approvals" },
        ]}
      />
    </DocsShell>
  );
}
