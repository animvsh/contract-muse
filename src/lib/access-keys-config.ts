export const CLIENTS = [
  { id: "opencode", label: "OpenCode", desc: "Open-source coding agent" },
  { id: "claude-code", label: "Claude Code", desc: "Anthropic's coding CLI" },
  { id: "cursor", label: "Cursor", desc: "Editor-native AI" },
  { id: "windsurf", label: "Windsurf", desc: "Codeium's agent editor" },
  { id: "custom", label: "Custom CLI", desc: "Any HTTP/MCP client" },
] as const;

export const PERMISSIONS = [
  {
    id: "read",
    label: "Read only",
    desc: "Search and ask questions. Cannot create, edit, or run anything.",
    allowed: ["Search workspace docs", "Ask the company brain"],
    blocked: ["Create drafts", "Run agents", "Send messages", "Delete data"],
  },
  {
    id: "sandbox",
    label: "Build in sandbox",
    desc: "Create tool drafts and run tests safely. Nothing goes live without approval.",
    allowed: ["Read approved docs", "Ask the brain", "Create tool drafts", "Run sandbox tests", "Submit for review"],
    blocked: ["Send emails", "Install tools", "Activate agents", "Delete data", "Access private docs"],
  },
  {
    id: "drafts",
    label: "Create drafts",
    desc: "Draft agents, APIs, and tools. Approval required before live.",
    allowed: ["Read approved docs", "Create agent / tool drafts", "Submit for review"],
    blocked: ["Send emails", "Activate agents", "Delete data"],
  },
  {
    id: "run-approved",
    label: "Run approved agents",
    desc: "Run agents that are already approved. Cannot edit or activate new ones.",
    allowed: ["Read approved docs", "Run approved agents", "Read run output"],
    blocked: ["Edit agents", "Activate new agents", "Delete data"],
  },
  {
    id: "admin",
    label: "Admin automation",
    desc: "High-trust workspace actions. Use only for trusted internal systems.",
    allowed: ["All read & write", "Run any approved agent", "Manage tools"],
    blocked: ["Billing changes"],
    warning: true,
  },
] as const;

export const SAFETY = [
  { id: "strict", label: "Strict", desc: "Everything new requires approval. Best for external builders." },
  { id: "balanced", label: "Balanced", desc: "Read & sandbox automatic. Live actions need approval. Default." },
  { id: "trusted", label: "Trusted", desc: "Approved actions can run directly. Best for internal systems." },
] as const;

export const SCOPES = [
  { id: "workspace", label: "Whole workspace" },
  { id: "team", label: "Specific team" },
  { id: "collection", label: "Specific collection" },
  { id: "sandbox", label: "Sandbox / demo data only" },
] as const;

export function clientLabel(id: string): string {
  return CLIENTS.find((c) => c.id === id)?.label ?? id;
}
export function permissionLabel(id: string): string {
  return PERMISSIONS.find((p) => p.id === id)?.label ?? id;
}
export function permissionMeta(id: string) {
  return PERMISSIONS.find((p) => p.id === id) ?? PERMISSIONS[1];
}
export function scopeLabel(id: string): string {
  return SCOPES.find((s) => s.id === id)?.label ?? id;
}
