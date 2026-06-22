import { createFileRoute } from "@tanstack/react-router";
import { DocsShell, DocsHero, DocsSection, NextSteps } from "@/components/docs-shell";

export const Route = createFileRoute("/docs/cli/cursor")({
  head: () => ({
    meta: [
      { title: "Connect Cursor — Beevr Docs" },
      { name: "description", content: "Use Beevr as a workspace-aware context source inside Cursor." },
    ],
  }),
  component: Cursor,
});

function Cursor() {
  return (
    <DocsShell>
      <DocsHero
        eyebrow="CLI Setup"
        title="Connect Cursor"
        lead="Cursor can use Beevr as a workspace-aware context source while you build."
      />

      <DocsSection title="Good uses">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Understanding company docs while editing code</li>
          <li>Generating internal tools from approved context</li>
          <li>Creating Beevr tool drafts and agent drafts</li>
          <li>Building dashboards on approved workspace data</li>
        </ul>
      </DocsSection>

      <NextSteps
        items={[
          { to: "/docs/access-keys", label: "Create an access key" },
          { to: "/docs/building-tools", label: "Build a tool" },
          { to: "/docs/cli/opencode", label: "Connect OpenCode" },
          { to: "/docs/cli/claude-code", label: "Connect Claude Code" },
        ]}
      />
    </DocsShell>
  );
}
