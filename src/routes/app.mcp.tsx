import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Plug, Bot, Database, ShieldCheck, Terminal } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/app/mcp")({
  component: McpPage,
});

const MCP_URL = "https://beevr.dev/api/mcp";

const CONFIG_CLAUDE = `{
  "mcpServers": {
    "beevr": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <YOUR_BEEVR_ACCESS_KEY>"
      }
    }
  }
}`;

const CONFIG_CURSOR = `// ~/.cursor/mcp.json
{
  "mcpServers": {
    "beevr": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer <YOUR_BEEVR_ACCESS_KEY>" }
    }
  }
}`;

const CONFIG_OPENCODE = `# ~/.config/opencode/config.toml
[[mcp_servers]]
name = "beevr"
url  = "${MCP_URL}"
headers = { Authorization = "Bearer <YOUR_BEEVR_ACCESS_KEY>" }`;

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-[oklch(0.98_0_0)]">
      <div className="flex items-center justify-between border-b border-black/5 bg-white/60 px-4 py-2">
        <span className="text-xs font-semibold text-[oklch(0.4_0_0)]">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="clicky-sm flex items-center gap-1.5 rounded-md border border-black/5 bg-white px-2 py-1 text-xs hover:bg-[oklch(0.97_0_0)]"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-[oklch(0.2_0_0)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function McpPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="MCP Server"
        subtitle="Plug Beevr's company brain into any MCP-compatible client. One endpoint, every tool, scoped to your access key."
      />

      <div className="space-y-8 px-6 pb-12 md:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Database, title: "All your business data", body: "Files, agents, APIs, connections, activity — exposed as MCP tools." },
            { icon: ShieldCheck, title: "Scoped by access key", body: "Each MCP client connects with a Beevr access key. Permissions follow the key." },
            { icon: Bot, title: "Works with any agent", body: "Claude Desktop, Cursor, OpenCode, Windsurf, custom AI SDK clients." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-black/5 bg-white p-5">
              <c.icon className="h-5 w-5 text-[oklch(0.68_0.22_40)]" />
              <div className="mt-3 text-sm font-semibold">{c.title}</div>
              <div className="mt-1 text-xs text-[oklch(0.45_0_0)]">{c.body}</div>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Plug className="h-4 w-4 text-[oklch(0.68_0.22_40)]" /> Endpoint
          </h2>
          <p className="text-sm text-[oklch(0.4_0_0)]">
            Beevr exposes a single Streamable HTTP MCP endpoint. Authenticate with an access key from{" "}
            <span className="font-medium text-[oklch(0.2_0_0)]">Developer → Access Keys</span>.
          </p>
          <CodeBlock label="MCP endpoint" code={MCP_URL} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Available tools</h2>
          <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[oklch(0.98_0_0)] text-left text-xs uppercase tracking-wider text-[oklch(0.45_0_0)]">
                <tr>
                  <th className="px-4 py-2.5">Tool</th>
                  <th className="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  ["brain.search", "Semantic search across files, docs, and notes in your workspace brain."],
                  ["brain.read", "Fetch the full contents of a brain document by ID."],
                  ["agents.list", "List agents in the current workspace."],
                  ["agents.run", "Trigger an agent with structured input and stream its reasoning."],
                  ["apis.list", "Enumerate APIs and their endpoints."],
                  ["apis.call", "Invoke an API endpoint with a JSON body, respecting safety policies."],
                  ["connections.list", "Show connected SaaS tools (Slack, HubSpot, Stripe, …)."],
                  ["files.search", "Find files by name or content."],
                  ["activity.recent", "Read recent activity for auditing or context."],
                ].map(([name, desc]) => (
                  <tr key={name}>
                    <td className="px-4 py-2.5 font-mono text-xs text-[oklch(0.2_0_0)]">{name}</td>
                    <td className="px-4 py-2.5 text-[oklch(0.4_0_0)]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Terminal className="h-4 w-4 text-[oklch(0.68_0.22_40)]" /> Connect a client
          </h2>
          <p className="text-sm text-[oklch(0.4_0_0)]">
            Paste the config below into your client. Replace{" "}
            <code className="rounded bg-[oklch(0.95_0_0)] px-1 py-0.5 text-xs">&lt;YOUR_BEEVR_ACCESS_KEY&gt;</code>{" "}
            with a key from Developer → Access Keys.
          </p>
          <CodeBlock label="Claude Desktop · claude_desktop_config.json" code={CONFIG_CLAUDE} />
          <CodeBlock label="Cursor · ~/.cursor/mcp.json" code={CONFIG_CURSOR} />
          <CodeBlock label="OpenCode · ~/.config/opencode/config.toml" code={CONFIG_OPENCODE} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Security</h2>
          <ul className="space-y-2 text-sm text-[oklch(0.4_0_0)]">
            <li>• Every request is authenticated with a Beevr access key — no anonymous traffic.</li>
            <li>• Tool permissions inherit from the access key's scopes and safety level.</li>
            <li>• Risky tool calls (writes, external sends) route through the Approvals queue.</li>
            <li>• All MCP calls are logged in Activity for full auditability.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
