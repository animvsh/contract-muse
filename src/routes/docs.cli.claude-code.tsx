import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, CopyBlock, NextSteps } from "@/components/docs-shell";

const PROMPT = `Use Beevr to understand this workspace before building.

First, check what knowledge and actions are available through the Beevr access key.
Then build a safe tool draft in sandbox.
Do not make live changes.
Submit the result to Beevr for review.`;

export const Route = createFileRoute("/docs/cli/claude-code")({
  head: () => ({
    meta: [
      { title: "Connect Claude Code — Beevr Docs" },
      { name: "description", content: "Set up Claude Code with a Beevr access key for workspace-aware tool building." },
    ],
  }),
  component: ClaudeCode,
});

function ClaudeCode() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="CLI Setup"
        title="Connect Claude Code"
        lead="Use Claude Code as a sandbox builder on top of your Beevr workspace."
      />

      <DocsSection title="Setup">
        <StepList
          steps={[
            "Create a Beevr access key.",
            "Select the workspace or team scope.",
            "Choose Build in sandbox.",
            "Copy the Claude Code setup.",
            "Paste it into your project context.",
            "Ask Claude Code to build a tool using Beevr context.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Recommended prompt">
        <CopyBlock label="Paste into Claude Code" code={PROMPT} />
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/cli/opencode", label: "Connect OpenCode" },
          { to: "/docs/cli/cursor", label: "Connect Cursor" },
          { to: "/docs/building-tools", label: "Build a tool" },
          { to: "/docs/approvals", label: "Approval flow" },
        ]}
      />
    </DocsShell>
  );
}
