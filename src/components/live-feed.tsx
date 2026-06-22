import { useEffect, useRef, useState } from "react";
import {
  FileText,
  MessageSquare,
  Mail,
  GitBranch,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Bot,
  ExternalLink,
  Clock,
  User as UserIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Update = {
  id: string;
  icon: typeof FileText;
  source: string;
  text: string;
  color: string;
  ts: number;
};

type Detail = {
  actor: string;
  action: string;
  target: string;
  preview: string;
  meta: { label: string; value: string }[];
};

const POOL: (Omit<Update, "id" | "ts"> & { detail: Detail })[] = [
  { icon: FileText, source: "Notion", text: "Adithya created 'Q4 Hiring Plan'", color: "oklch(0.25 0 0)", detail: { actor: "Adithya Rao", action: "created a page", target: "Q4 Hiring Plan", preview: "Drafted hiring targets for engineering, design, and GTM. 14 open roles across Q4. Includes leveling matrix and budget breakdown.", meta: [{ label: "Workspace", value: "Beevr · People" }, { label: "Visibility", value: "Team" }] } },
  { icon: MessageSquare, source: "Slack", text: "12 new messages in #engineering", color: "oklch(0.55 0.22 320)", detail: { actor: "#engineering", action: "received messages", target: "12 new messages", preview: "Mostly around the v2 deploy pipeline. Maya flagged a flaky test in CI; Jordan opened a thread about the new caching layer.", meta: [{ label: "Channel", value: "#engineering" }, { label: "Participants", value: "8 people" }] } },
  { icon: Mail, source: "Gmail", text: "Maya replied to 'Onboarding'", color: "oklch(0.6 0.22 25)", detail: { actor: "Maya Chen", action: "replied to thread", target: "Onboarding", preview: "Looks good — I'll set up the welcome doc and ping Sarah for review by EOD. Let's also add a section on access keys.", meta: [{ label: "Thread", value: "Onboarding · 4 messages" }, { label: "Labels", value: "Internal" }] } },
  { icon: GitBranch, source: "GitHub", text: "PR #482 merged by Sarah", color: "oklch(0.25 0 0)", detail: { actor: "Sarah Liu", action: "merged pull request", target: "#482 · Add agent retry logic", preview: "+248 / -91 across 12 files. Adds exponential backoff for tool calls and surfaces retry count in the activity feed.", meta: [{ label: "Repo", value: "beevr/core" }, { label: "Branch", value: "feat/agent-retries → main" }] } },
  { icon: Bot, source: "Agent", text: "Sales Digest posted weekly summary", color: "oklch(0.62 0.22 40)", detail: { actor: "Sales Digest agent", action: "completed run", target: "Weekly summary", preview: "Closed-won: $128k across 14 deals. Pipeline up 22% w/w. Top deal: Globex ($42k). Next steps queued for 3 stalled accounts.", meta: [{ label: "Run", value: "run_8af2 · 4.2s" }, { label: "Cost", value: "$0.18" }] } },
  { icon: FileText, source: "Drive", text: "New file: 'Investor Update Nov.pdf'", color: "oklch(0.55 0.18 145)", detail: { actor: "Adithya Rao", action: "uploaded file", target: "Investor Update Nov.pdf", preview: "16-page deck covering ARR growth, agent adoption metrics, and the roadmap for Q1. Shared with the board folder.", meta: [{ label: "Folder", value: "Board / 2026" }, { label: "Size", value: "4.2 MB" }] } },
  { icon: Calendar, source: "Calendar", text: "Meeting 'Design review' starts in 15m", color: "oklch(0.55 0.2 250)", detail: { actor: "Calendar", action: "upcoming meeting", target: "Design review", preview: "Walkthrough of the new builds dashboard and live activity panel. Bring open questions on the workspace switcher.", meta: [{ label: "When", value: "in 15 minutes · 30m" }, { label: "Attendees", value: "5 people" }] } },
  { icon: DollarSign, source: "Stripe", text: "$4,820 invoice paid by Acme Corp", color: "oklch(0.55 0.2 280)", detail: { actor: "Acme Corp", action: "paid invoice", target: "INV-2041 · $4,820.00", preview: "Annual plan renewal, paid via ACH. Receipt sent to billing@acme.com. Net terms: 0 days.", meta: [{ label: "Plan", value: "Team · annual" }, { label: "Method", value: "ACH transfer" }] } },
  { icon: Users, source: "HubSpot", text: "New deal: Globex · $42k", color: "oklch(0.62 0.22 35)", detail: { actor: "Jordan Park", action: "created deal", target: "Globex · $42,000", preview: "Stage: Proposal sent. Expected close: end of month. Champion is their VP Eng. Next step: technical deep-dive on Friday.", meta: [{ label: "Stage", value: "Proposal sent" }, { label: "Owner", value: "Jordan Park" }] } },
  { icon: Zap, source: "Linear", text: "Adithya moved BEE-218 to In Progress", color: "oklch(0.5 0.2 280)", detail: { actor: "Adithya Rao", action: "updated issue", target: "BEE-218 · Live activity modal", preview: "Adds a clickable detail modal to the live feed sidebar with actor, target, preview, and metadata.", meta: [{ label: "Project", value: "Beevr App" }, { label: "Priority", value: "Medium" }] } },
  { icon: MessageSquare, source: "Slack", text: "Animesh mentioned you in #product", color: "oklch(0.55 0.22 320)", detail: { actor: "Animesh", action: "mentioned you", target: "#product", preview: "@you can we sync on the new keys flow tomorrow? Want to make sure the docs match the dashboard before we ship.", meta: [{ label: "Channel", value: "#product" }, { label: "Reactions", value: "👀 ✅" }] } },
  { icon: FileText, source: "Notion", text: "Sarah edited 'Beevr Brand Guidelines'", color: "oklch(0.25 0 0)", detail: { actor: "Sarah Liu", action: "edited a page", target: "Beevr Brand Guidelines", preview: "Updated the primary palette to the new warm neutral set and added do/don't examples for the wordmark.", meta: [{ label: "Workspace", value: "Beevr · Brand" }, { label: "Last edited", value: "just now" }] } },
  { icon: Bot, source: "Agent", text: "Inbox Triage labeled 7 emails", color: "oklch(0.62 0.22 40)", detail: { actor: "Inbox Triage agent", action: "completed run", target: "7 emails labeled", preview: "3 → Customer, 2 → Recruiting, 1 → Billing, 1 → Spam. Two flagged for human review based on low confidence.", meta: [{ label: "Run", value: "run_2c1d · 1.8s" }, { label: "Cost", value: "$0.04" }] } },
  { icon: Mail, source: "Gmail", text: "Contract signed by adithya@beevr.dev", color: "oklch(0.6 0.22 25)", detail: { actor: "Adithya Rao", action: "signed contract", target: "MSA · Globex Corp", preview: "Counter-signed via DocuSign. Effective Nov 15. Auto-renews annually unless cancelled 30 days prior.", meta: [{ label: "Vendor", value: "Globex Corp" }, { label: "Effective", value: "Nov 15, 2026" }] } },
];

type FullUpdate = Update & { detail: Detail };

function relative(ts: number, now: number): string {
  const s = Math.max(1, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function LiveFeed() {
  const now0 = Date.now();
  const [items, setItems] = useState<FullUpdate[]>(() =>
    POOL.slice(0, 4).map((p, i) => ({ ...p, id: `seed-${i}`, ts: now0 - (i + 1) * 45_000 })),
  );
  const [newCount, setNewCount] = useState(0);
  const [now, setNow] = useState(now0);
  const [selected, setSelected] = useState<FullUpdate | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const pick = POOL[Math.floor(Math.random() * POOL.length)];
      setItems((prev) =>
        [{ ...pick, id: crypto.randomUUID(), ts: Date.now() }, ...prev].slice(0, 12),
      );
      setNewCount((n) => n + 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };
    const schedule = (): ReturnType<typeof setTimeout> => {
      const delay = 2500 + Math.random() * 3500;
      return setTimeout(() => {
        tick();
        timer = schedule();
      }, delay);
    };
    let timer = schedule();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);

  return (
    <div className="hidden w-72 shrink-0 border-l border-black/5 bg-white xl:flex xl:flex-col">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <h3 className="text-sm font-semibold tracking-tight">Live activity</h3>
        </div>
        {newCount > 0 && (
          <button
            onClick={() => {
              setNewCount(0);
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="clicky rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/25"
          >
            {newCount} new
          </button>
        )}
      </div>
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-3">
        {/* timeline rail */}
        <div className="pointer-events-none absolute bottom-3 left-[26px] top-3 w-px bg-border" />
        <ul className="space-y-2">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isNew = idx === 0;
            return (
              <li
                key={item.id}
                onClick={() => setSelected(item)}
                className={`group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border bg-white/90 p-2.5 text-left text-xs shadow-sm transition-all duration-300 ${
                  isNew
                    ? "feed-enter border-primary/40 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
                    : "border-black/[0.05] hover:-translate-y-0.5 hover:border-black/10 hover:shadow-md active:scale-[0.98]"
                }`}
                
              >
                <div className="relative">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {isNew && (
                    <span
                      className="absolute -inset-0.5 -z-0 animate-ping rounded-lg opacity-60"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {item.source}
                    </span>
                    <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground/70">
                      {relative(item.ts, now)}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-foreground">{item.text}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (() => {
            const Icon = selected.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: selected.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {selected.source}
                      </div>
                      <DialogTitle className="text-base">{selected.detail.target}</DialogTitle>
                    </div>
                  </div>
                  <DialogDescription className="flex items-center gap-1.5 pt-1 text-xs">
                    <UserIcon className="h-3 w-3" />
                    <span className="font-medium text-foreground">{selected.detail.actor}</span>
                    <span>{selected.detail.action}</span>
                    <span className="mx-1">·</span>
                    <Clock className="h-3 w-3" />
                    <span>{relative(selected.ts, now)}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl border border-black/5 bg-[oklch(0.98_0_0)] p-3 text-sm leading-relaxed text-foreground">
                  {selected.detail.preview}
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  {selected.detail.meta.map((m) => (
                    <div key={m.label} className="rounded-lg border border-black/5 bg-white p-2.5">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</dt>
                      <dd className="mt-0.5 truncate font-medium text-foreground">{m.value}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  className="clicky-sm inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                  onClick={() => setSelected(null)}
                >
                  Open in {selected.source}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
