import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsCard, DocsSection } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Beevr Docs — Build on top of your company brain" },
      {
        name: "description",
        content:
          "Connect coding agents and CLIs to Beevr. Create access keys, build tools in sandbox, and submit them for approval.",
      },
      { property: "og:title", content: "Beevr Docs" },
      { property: "og:description", content: "Build safely on top of your company brain." },
    ],
  }),
  component: DocsHome,
});

function DocsHome() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="Documentation"
        title="Build on top of Beevr"
        lead="Beevr lets coding agents, CLIs, and internal apps safely work with your company brain. Create an access key, connect your tool, build in sandbox, and submit changes for approval."
      />

      <DocsSection title="Start here">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DocsCard to="/docs/quickstart" title="Quickstart" description="Ship your first Beevr-powered tool in 5 minutes." />
          <DocsCard to="/docs/access-keys" title="Access keys" description="The product object that powers everything." />
          <DocsCard to="/docs/cli/opencode" title="Connect OpenCode" description="Paste-ready setup for OpenCode sessions." />
          <DocsCard to="/docs/cli/claude-code" title="Connect Claude Code" description="Workspace-aware context for Claude Code." />
          <DocsCard to="/docs/cli/cursor" title="Connect Cursor" description="Use Beevr as a context source in Cursor." />
          <DocsCard to="/docs/building-tools" title="Build a tool" description="Sandbox → tests → review → install." />
          <DocsCard to="/docs/approvals" title="Approvals & safety" description="How risky actions get reviewed." />
          <DocsCard to="/docs/examples" title="Examples" description="Ready-to-use prompts and tool ideas." />
        </div>
      </DocsSection>

      <DocsSection title="Works with">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {["OpenCode", "Claude Code", "Cursor", "Windsurf", "Custom CLI", "Internal app"].map((n) => (
            <div
              key={n}
              className="clicky rounded-lg border border-border bg-card px-3 py-4 text-center text-sm font-medium"
            >
              {n}
            </div>
          ))}
        </div>
      </DocsSection>
    </DocsShell>
  );
}
