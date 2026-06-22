import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Copy, Check, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

const NAV: { group: string; items: { title: string; to: string }[] }[] = [
  {
    group: "Getting Started",
    items: [
      { title: "Overview", to: "/docs" },
      { title: "Quickstart", to: "/docs/quickstart" },
      { title: "Access keys", to: "/docs/access-keys" },
    ],
  },
  {
    group: "CLI Setup",
    items: [
      { title: "OpenCode", to: "/docs/cli/opencode" },
      { title: "Claude Code", to: "/docs/cli/claude-code" },
      { title: "Cursor", to: "/docs/cli/cursor" },
    ],
  },
  {
    group: "Building on Beevr",
    items: [
      { title: "Building tools", to: "/docs/building-tools" },
      { title: "Customer health dashboard", to: "/docs/building-tools/customer-health-dashboard" },
      { title: "Agents", to: "/docs/agents" },
    ],
  },
  {
    group: "Cloud Builds",
    items: [
      { title: "Overview", to: "/docs/cloud-builds" },
      { title: "Build agents in cloud", to: "/docs/cloud-builds/agents" },
    ],
  },
  {
    group: "Access & Safety",
    items: [
      { title: "Approvals", to: "/docs/approvals" },
      { title: "Activity logs", to: "/docs/activity-logs" },
    ],
  },
  {
    group: "Examples",
    items: [
      { title: "Example library", to: "/docs/examples" },
      { title: "Bookstore sales agent", to: "/docs/examples/bookstore-sales-agent" },
    ],
  },
];

export function DocsShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6">
          <Link to="/" className="font-semibold tracking-tight">
            beevr<span className="text-primary">.</span>dev
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Docs</span>
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm w-72">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search docs…"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground">⌘K</kbd>
          </div>
          <Link
            to="/app/keys"
            className="clicky rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create access key
          </Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-10 px-6 py-10">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-6">
            {NAV.map((g) => (
              <div key={g.group}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.group}
                </div>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const active = path === it.to;
                    return (
                      <li key={it.to}>
                        <Link
                          to={it.to}
                          className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                            active
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          {it.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function DocsHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="border-b border-border pb-8">
      {eyebrow && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      )}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-base text-muted-foreground">{lead}</p>}
    </div>
  );
}

export function DocsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      {title && <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>}
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export function CopyBlock({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">{label ?? "Snippet"}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="clicky clicky-sm flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DocsCard({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="clicky group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function NextSteps({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          className="clicky flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
        >
          <span>{i.label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
