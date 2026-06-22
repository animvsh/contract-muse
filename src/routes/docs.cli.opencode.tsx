import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, StepList, CopyBlock, NextSteps } from "@/components/docs-shell";

const SETUP = `You are connected to the Beevr workspace using a workspace access key.

Use Beevr as the source of truth for approved company knowledge, docs, agents, and tool-building permissions.

Before building anything:
1. Check what Beevr data and actions are available.
2. Create a plan.
3. Build only inside sandbox.
4. Run tests.
5. Submit completed tools or agents for Beevr approval.

Do not send external messages, delete data, install tools, activate agents, or access restricted docs unless Beevr explicitly allows it.`;

export const Route = createFileRoute("/docs/cli/opencode")({
  head: () => ({
    meta: [
      { title: "Connect OpenCode — Beevr Docs" },
      { name: "description", content: "Use a Beevr access key to give OpenCode safe, scoped workspace access." },
    ],
  }),
  component: OpenCode,
});

function OpenCode() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="CLI Setup"
        title="Connect OpenCode"
        lead="Give OpenCode safe, scoped access to your Beevr workspace so it can plan, build, and submit tools for review."
      />

      <DocsSection title="What this lets OpenCode do">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Read approved knowledge sources from your workspace</li>
          <li>Build new tools in sandbox</li>
          <li>Run tests against simulated data</li>
          <li>Submit finished tools to Beevr for approval</li>
        </ul>
      </DocsSection>

      <DocsSection title="Setup">
        <StepList
          steps={[
            "Open Access Keys in Beevr and click Create access key.",
            "Choose OpenCode and select a workspace scope (e.g. Support team).",
            "Pick the Build in sandbox permission profile.",
            "Copy the OpenCode setup block below into your OpenCode session.",
            "Ask OpenCode to build a tool using Beevr context.",
          ]}
        />
      </DocsSection>

      <DocsSection title="OpenCode setup block">
        <CopyBlock label="Paste into OpenCode" code={SETUP} />
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/building-tools", label: "Build your first tool" },
          { to: "/docs/building-tools/customer-health-dashboard", label: "Example: customer health dashboard" },
          { to: "/docs/approvals", label: "Approval flow" },
          { to: "/docs/cli/claude-code", label: "Connect Claude Code" },
        ]}
      />
    </DocsShell>
  );
}
