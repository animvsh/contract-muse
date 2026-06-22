import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Phone, Trophy, Bug, Send, Sparkles, Check, Loader2, Cloud, Zap, Database,
  Workflow, Shield, RefreshCw, PhoneIncoming, Mail, MessageSquare, Github, FileText,
  Activity, Users, TrendingUp, AlertTriangle, PlayCircle, BellRing, Cpu, Code2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { routeBuildPrompt, type DemoAppId } from "@/lib/build-router.functions";

export const Route = createFileRoute("/app/build")({
  component: BuildPage,
});

// =========================================================
// Types & constants
// =========================================================
type Phase =
  | "idle" | "matched" | "planning" | "scanning" | "generating_ui"
  | "creating_backend" | "testing" | "preview_ready"
  | "editing" | "edited" | "activating" | "agent_active";

type ChatMsg = {
  id: string;
  delay: number;
  content: string;
  variant?: "normal" | "plan" | "complete" | "code" | "tool";
  plan?: string[];
  code?: { lang: string; file: string; lines: string[] };
  tool?: { name: string; status: string; meta?: string };
};
type TimelineStep = { id: string; label: string };

const TIMELINE: { phase: Phase; at: number }[] = [
  { phase: "matched", at: 0 },
  { phase: "planning", at: 2000 },
  { phase: "scanning", at: 6000 },
  { phase: "generating_ui", at: 13000 },
  { phase: "creating_backend", at: 20000 },
  { phase: "testing", at: 26000 },
  { phase: "preview_ready", at: 30000 },
];

const BASE_BUILD_MS = 30000;
const MIN_BUILD_MS = 30000;
const MAX_BUILD_MS = 45000;
const randomBuildDuration = () => MIN_BUILD_MS + Math.floor(Math.random() * (MAX_BUILD_MS - MIN_BUILD_MS + 1));
const scaleBuildTime = (at: number, duration: number) => Math.round((at / BASE_BUILD_MS) * duration);

const STEP_PHASE: Record<string, Phase> = {
  understand: "matched",
  sources: "planning",
  scan: "scanning",
  design: "generating_ui",
  generate: "generating_ui",
  connect: "creating_backend",
  actions: "creating_backend",
  test: "testing",
  ready: "preview_ready",
};

const STEPS: TimelineStep[] = [
  { id: "understand", label: "Understand request" },
  { id: "sources", label: "Find data sources" },
  { id: "scan", label: "Scan tools" },
  { id: "design", label: "Design app structure" },
  { id: "generate", label: "Generate interface" },
  { id: "connect", label: "Connect data views" },
  { id: "actions", label: "Add actions / workflows" },
  { id: "test", label: "Test preview" },
  { id: "ready", label: "Ready" },
];

// =========================================================
// App catalog
// =========================================================
type AppDef = {
  id: DemoAppId;
  name: string;
  tagline: string;
  icon: typeof Phone;
  accent: string;
  examplePrompt: string;
  tools: { name: string; icon: typeof Phone; records: string }[];
  buildPlan: string[];
  chat: ChatMsg[];
  editChip: string;
  editPrompt: string;
  editToast: string;
  activateChip: string;
  activatePrompt: string;
  activateToast: string;
};

const APPS: Record<DemoAppId, AppDef> = {
  phone: {
    id: "phone",
    name: "Business Support Phone Line",
    tagline: "AI voice line that answers from company knowledge and captures leads.",
    icon: Phone,
    accent: "oklch(0.68 0.18 250)",
    examplePrompt: "Build a support phone line that answers customer questions using our company docs and captures leads.",
    tools: [
      { name: "Website", icon: FileText, records: "14 pages indexed" },
      { name: "Docs", icon: FileText, records: "23 product docs found" },
      { name: "Gmail", icon: Mail, records: "38 customer questions" },
      { name: "Slack", icon: MessageSquare, records: "17 product notes" },
      { name: "Voice", icon: Phone, records: "phone system ready" },
      { name: "Knowledge Base", icon: Database, records: "62 snippets generated" },
    ],
    buildPlan: [
      "Index Beevr website and docs",
      "Pull product FAQ and internal notes",
      "Search common customer questions",
      "Create voice assistant behavior",
      "Set up phone line screen",
      "Add call logs and transcripts",
      "Add lead capture",
      "Add Slack summaries",
    ],
    chat: [
      { id: "m1", delay: 600, content: "**Building: Business Support Phone Line**\n\nI'll build a support phone line for Beevr that answers questions using company knowledge, captures leads, and escalates anything it cannot answer." },
      { id: "m2", delay: 3000, variant: "plan", content: "Build plan", plan: [
        "Index Beevr website and docs",
        "Pull product FAQ and internal notes",
        "Search common customer questions",
        "Create voice assistant behavior",
        "Set up phone line screen",
        "Add call logs and transcripts",
        "Add lead capture",
        "Add Slack summaries",
      ] },
      { id: "m3", delay: 5200, variant: "tool", content: "", tool: { name: "scan_company_data", status: "running", meta: "website · docs · gmail · slack" } },
      { id: "m3b", delay: 7400, content: "Crawling beevr.dev and indexing the docs site." },
      { id: "m3c", delay: 8800, variant: "code", content: "", code: { lang: "ts", file: "knowledge/index.ts", lines: [
        "import { chunk, embed } from '@/lib/knowledge';",
        "",
        "const sources = [",
        "  { kind: 'web',   url: 'https://beevr.dev' },",
        "  { kind: 'docs',  path: '/product/docs/**' },",
        "  { kind: 'gmail', query: 'label:support newer_than:30d' },",
        "  { kind: 'slack', channel: '#product' },",
        "];",
        "",
        "for (const s of sources) {",
        "  const docs = await fetchSource(s);",
        "  await embed(chunk(docs, 800));",
        "}",
      ] } },
      { id: "m4", delay: 11200, content: "Found **14 indexed pages**, **23 product docs**, **38 customer questions** and **17 Slack notes** — built **62 KB snippets**." },
      { id: "m4b", delay: 13000, variant: "tool", content: "", tool: { name: "provision_phone_number", status: "ok", meta: "+1 (872) 666-9131" } },
      { id: "m5", delay: 14600, content: "Generating the voice system dashboard and call handling workflow." },
      { id: "m5b", delay: 16200, variant: "code", content: "", code: { lang: "ts", file: "agents/phone-line.ts", lines: [
        "export const phoneLine = defineVoiceAgent({",
        "  number: '+18726669131',",
        "  greeting:",
        "    \"Hi, this is Beevr. I can help with product questions, \" +",
        "    \"pricing, demos, or connect you to a teammate.\",",
        "  knowledge: ['beevr.dev', 'docs', 'faq', 'slack:#product'],",
        "  actions: [captureLead, escalateToHuman, bookDemo],",
        "});",
      ] } },
      { id: "m6", delay: 21000, content: "Wiring lead capture, escalation rules, and Slack summaries." },
      { id: "m6b", delay: 23000, variant: "code", content: "", code: { lang: "ts", file: "workflows/after-call.ts", lines: [
        "on('call.completed', async (call) => {",
        "  const summary = await summarize(call.transcript);",
        "  await slack.post('#support', summary);",
        "  if (call.intent === 'lead') {",
        "    await hubspot.createLead(call.contact);",
        "  }",
        "  if (call.escalated) {",
        "    await pager.notify('on-call', call);",
        "  }",
        "});",
      ] } },
      { id: "m6c", delay: 18000, variant: "tool", content: "", tool: { name: "configure_telephony", status: "ok", meta: "twilio · sip trunk · TLS" } },
      { id: "m6d", delay: 19400, content: "Configured greeting, fallback voicemail, and after-hours routing." },
      { id: "m6e", delay: 24500, variant: "code", content: "", code: { lang: "ts", file: "policies/escalation.ts", lines: [
        "export const escalation = {",
        "  triggers: ['refund', 'angry', 'billing dispute', 'enterprise'],",
        "  route:    { to: 'on-call', via: ['slack', 'sms'] },",
        "  sla:      { firstResponseSec: 90 },",
        "};",
      ] } },
      { id: "m6f", delay: 26000, content: "Generating analytics: calls/day, intent breakdown, lead funnel, average handle time." },
      { id: "m7", delay: 27000, variant: "tool", content: "", tool: { name: "preview_checks", status: "passed", meta: "8/8 checks · 412ms" } },
      { id: "m7b", delay: 28200, content: "Smoke-tested with 12 synthetic calls — greeting, knowledge lookup, lead capture, escalation all green." },
      { id: "m8", delay: 30000, variant: "complete", content: "**Your Business Support Phone Line is ready.**\n\nLive on **+1 (872) 666-9131** with greeting, knowledge sources, call logs, lead capture, escalation rules and analytics. **0 calls, 0 leads, 0 escalations** — line just went live." },
    ],
    editChip: "Add a demo booking flow",
    editPrompt: "Add a demo booking flow when someone asks for a demo.",
    editToast: "Demo booking flow added",
    activateChip: "Turn this on & send summaries to Slack",
    activatePrompt: "Turn this on and send call summaries to Slack.",
    activateToast: "Phone line is live",
  },
  leaderboard: {
    id: "leaderboard",
    name: "Builder Leaderboard",
    tagline: "Live internal tool ranking builders by features, tokens, lines & PRs.",
    icon: Trophy,
    accent: "oklch(0.68 0.22 40)",
    examplePrompt: "Build a leaderboard showing who is building what features and how many tokens and lines they are shipping.",
    tools: [
      { name: "GitHub", icon: Github, records: "42 commits found" },
      { name: "Pull Requests", icon: Github, records: "11 active PRs" },
      { name: "Linear", icon: Workflow, records: "18 feature tasks" },
      { name: "OpenCode Logs", icon: Code2, records: "1.8M tokens tracked" },
      { name: "Slack", icon: MessageSquare, records: "27 build updates" },
    ],
    buildPlan: [
      "Pull builders from GitHub and Slack",
      "Read feature tasks from Linear",
      "Analyze commits and PRs",
      "Pull token usage from OpenCode logs",
      "Calculate lines changed",
      "Group activity by feature",
      "Build leaderboard and charts",
      "Add weekly report agent",
    ],
    chat: [
      { id: "m1", delay: 600, content: "**Building: Builder Leaderboard**\n\nI'll build a leaderboard showing who is building what features, token usage, lines changed, commits, PRs, and shipped work." },
      { id: "m2", delay: 3000, variant: "plan", content: "Build plan", plan: [
        "Pull builders from GitHub and Slack",
        "Read feature tasks from Linear",
        "Analyze commits and PRs",
        "Pull token usage from OpenCode logs",
        "Calculate lines changed",
        "Group activity by feature",
        "Build leaderboard and charts",
        "Add weekly report agent",
      ] },
      { id: "m3", delay: 5200, variant: "tool", content: "", tool: { name: "scan_dev_signals", status: "running", meta: "github · linear · opencode · slack" } },
      { id: "m3b", delay: 7400, content: "Pulling commits, PRs, Linear features and OpenCode token logs." },
      { id: "m3c", delay: 8800, variant: "code", content: "", code: { lang: "ts", file: "queries/builders.ts", lines: [
        "const builders = await db.sql`",
        "  select author,",
        "         count(*) filter (where kind='commit') as commits,",
        "         count(*) filter (where kind='pr')     as prs,",
        "         sum(lines_added + lines_removed)      as lines,",
        "         sum(tokens)                           as tokens",
        "  from activity",
        "  where ts > now() - interval '7 days'",
        "  group by author order by tokens desc;",
        "`;",
      ] } },
      { id: "m4", delay: 11200, content: "Found **42 commits**, **11 active PRs**, **18 feature tasks**, and **1.8M tracked tokens** this week." },
      { id: "m5", delay: 14600, content: "Generating leaderboard views and matching builder activity to features." },
      { id: "m5b", delay: 16400, variant: "code", content: "", code: { lang: "tsx", file: "views/leaderboard.tsx", lines: [
        "export function Leaderboard({ builders }) {",
        "  return builders.map((b, i) => (",
        "    <Row key={b.id}>",
        "      <Rank>{i + 1}</Rank>",
        "      <Name>{b.name}</Name>",
        "      <Tokens>{fmt(b.tokens)}</Tokens>",
        "      <Lines>{b.lines.toLocaleString()}</Lines>",
        "    </Row>",
        "  ));",
        "}",
      ] } },
      { id: "m6", delay: 21000, content: "Wiring the weekly reporting workflow and feature activity state." },
      { id: "m6b", delay: 23000, variant: "code", content: "", code: { lang: "ts", file: "agents/weekly-report.ts", lines: [
        "export const weeklyBuilderReport = defineAgent({",
        "  schedule: 'cron(0 17 * * 5)', // Fri 5pm PT",
        "  steps: [",
        "    getLeaderboard,",
        "    getShippedFeatures,",
        "    summarizeForSlack,",
        "    post('#build'),",
        "  ],",
        "});",
      ] } },
      { id: "m6c", delay: 18000, variant: "tool", content: "", tool: { name: "sync_opencode_logs", status: "ok", meta: "1,842,331 tokens · 14,217 lines" } },
      { id: "m6d", delay: 19400, content: "Mapping commits → features → builders → tokens. Building feature heatmap." },
      { id: "m6e", delay: 24500, variant: "code", content: "", code: { lang: "ts", file: "lib/score.ts", lines: [
        "export const score = (b: Builder) =>",
        "  b.tokens * 0.4 +",
        "  b.linesChanged * 0.2 +",
        "  b.prsMerged * 50 +",
        "  b.featuresShipped * 250;",
      ] } },
      { id: "m6f", delay: 26000, content: "Generating top builders chart, feature breakdown, and shipped vs in-progress split." },
      { id: "m7", delay: 27000, variant: "tool", content: "", tool: { name: "preview_checks", status: "passed", meta: "6/6 checks · 318ms" } },
      { id: "m7b", delay: 28200, content: "Verified ranking math against last week's deploys — within ±1 across all 8 builders." },
      { id: "m8", delay: 30000, variant: "complete", content: "**Your Builder Leaderboard is ready.**\n\nLive internal tool: 8 active builders, 18 features, 1.8M tokens, 14.2K lines changed, 11 active PRs — plus charts and a weekly report agent." },
    ],
    editChip: "Add a shipped features view",
    editPrompt: "Add a shipped features view.",
    editToast: "Shipped features view added",
    activateChip: "Send a weekly builder report on Fridays",
    activatePrompt: "Send a weekly builder report every Friday.",
    activateToast: "Weekly Builder Report agent active",
  },
  bugs: {
    id: "bugs",
    name: "Bugs & User Activity Dashboard",
    tagline: "Product health: bugs, runtime errors, sessions, affected users, alerts.",
    icon: Bug,
    accent: "oklch(0.62 0.22 25)",
    examplePrompt: "Build a product health dashboard that shows bugs, runtime errors, user sessions and pilot-impacting issues.",
    tools: [
      { name: "GitHub", icon: Github, records: "18 open issues found" },
      { name: "Linear", icon: Workflow, records: "11 bug tickets" },
      { name: "Logs", icon: AlertTriangle, records: "246 runtime errors" },
      { name: "Analytics", icon: Activity, records: "1,284 sessions" },
      { name: "Slack", icon: MessageSquare, records: "24 bug mentions" },
      { name: "Gmail", icon: Mail, records: "7 user-reported issues" },
    ],
    buildPlan: [
      "Pull bugs from GitHub and Linear",
      "Read runtime errors from logs",
      "Pull user activity from analytics",
      "Search Slack for bug reports",
      "Search Gmail for user-reported issues",
      "Group issues by severity",
      "Build product health dashboard",
      "Add critical issue alerts",
    ],
    chat: [
      { id: "m1", delay: 600, content: "**Building: Bugs & User Activity Dashboard**\n\nI'll build a product health dashboard that combines bugs, runtime errors, user sessions, product usage, and user-impacting issues." },
      { id: "m2", delay: 3000, variant: "plan", content: "Build plan", plan: [
        "Pull bugs from GitHub and Linear",
        "Read runtime errors from logs",
        "Pull user activity from analytics",
        "Search Slack for bug reports",
        "Search Gmail for user-reported issues",
        "Group issues by severity",
        "Build product health dashboard",
        "Add critical issue alerts",
      ] },
      { id: "m3", delay: 5200, variant: "tool", content: "", tool: { name: "scan_bug_signals", status: "running", meta: "github · linear · logs · analytics · slack · gmail" } },
      { id: "m3b", delay: 7400, content: "Pulling open issues, runtime errors and recent user sessions." },
      { id: "m3c", delay: 8800, variant: "code", content: "", code: { lang: "ts", file: "queries/bugs.ts", lines: [
        "const bugs = await Promise.all([",
        "  github.issues.list({ state: 'open', labels: 'bug' }),",
        "  linear.issues({ filter: { labels: { in: ['bug'] } } }),",
        "  logs.query(`error_count > 0 last 7d group by message`),",
        "  analytics.sessions({ window: '7d' }),",
        "]);",
        "const correlated = correlateByStackTrace(bugs);",
      ] } },
      { id: "m4", delay: 11200, content: "Found **18 open issues**, **11 bug tickets**, **246 runtime errors** and **1,284 sessions**." },
      { id: "m5", delay: 14600, content: "Generating the product health dashboard and linking issues to affected users." },
      { id: "m5b", delay: 16400, variant: "code", content: "", code: { lang: "tsx", file: "views/health.tsx", lines: [
        "<Grid>",
        "  <Metric label='Open bugs'      value={bugs.length} />",
        "  <Metric label='Pilot-blocking' value={pilotBlockers.length} />",
        "  <Metric label='Runtime errors' value={errors.last7d} />",
        "  <Metric label='Sessions'       value={sessions.total} />",
        "</Grid>",
      ] } },
      { id: "m6", delay: 21000, content: "Wiring alert rules for critical bugs and pilot customers." },
      { id: "m6b", delay: 23000, variant: "code", content: "", code: { lang: "ts", file: "agents/pilot-alerts.ts", lines: [
        "on('bug.critical', async (bug) => {",
        "  if (!affectsPilot(bug)) return;",
        "  await slack.post('#engineering', renderAlert(bug));",
        "  await linear.createIssue({ ...bug, label: 'pilot-blocker' });",
        "});",
      ] } },
      { id: "m6c", delay: 18000, variant: "tool", content: "", tool: { name: "correlate_stacks", status: "ok", meta: "246 errors → 38 unique groups" } },
      { id: "m6d", delay: 19400, content: "Grouping by stack trace, mapping errors to affected users and pilot accounts." },
      { id: "m6e", delay: 24500, variant: "code", content: "", code: { lang: "ts", file: "lib/severity.ts", lines: [
        "export const severity = (b: Bug) => {",
        "  if (b.affectsPilot && b.usersAffected > 5) return 'critical';",
        "  if (b.usersAffected > 20)                  return 'high';",
        "  if (b.errorRate7d > 0.02)                  return 'high';",
        "  return b.usersAffected > 0 ? 'medium' : 'low';",
        "};",
      ] } },
      { id: "m6f", delay: 26000, content: "Generating severity heatmap, top error groups, and pilot-impact view." },
      { id: "m7", delay: 27000, variant: "tool", content: "", tool: { name: "preview_checks", status: "passed", meta: "7/7 checks · 287ms" } },
      { id: "m7b", delay: 28200, content: "Validated correlations on the last 7d window — 100% of pilot-blocking bugs linked to a Linear ticket." },
      { id: "m8", delay: 30000, variant: "complete", content: "**Your Bugs & User Activity Dashboard is ready.**\n\n18 open bugs, 5 critical, 1,284 sessions, 246 runtime errors, 3 pilot-blocking bugs and 92% agent success." },
    ],
    editChip: "Show pilot-blocking bugs first",
    editPrompt: "Show pilot-blocking bugs first.",
    editToast: "Pilot blockers prioritized",
    activateChip: "Alert engineering on critical pilot bugs",
    activatePrompt: "Alert engineering when a critical bug affects a pilot customer.",
    activateToast: "Pilot Bug Alert agent active",
  },
};

// =========================================================
// Page
// =========================================================
function BuildPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [appId, setAppId] = useState<DemoAppId | null>(null);
  const [prompt, setPrompt] = useState("");
  const [routing, setRouting] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0); // 0..tools.length
  const [edited, setEdited] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  const [tweaks, setTweaks] = useState<string[]>([]);
  const [tweakInput, setTweakInput] = useState("");
  const [tweaking, setTweaking] = useState(false);
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const router = useServerFn(routeBuildPrompt);

  const app = appId ? APPS[appId] : null;

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const reset = () => {
    clearTimers();
    setPhase("idle"); setAppId(null); setPrompt("");
    setMessages([]); setCompletedSteps(new Set()); setRunningStep(null);
    setScanProgress(0); setEdited(false); setAgentActive(false);
    setTweaks([]); setTweakInput(""); setTweaking(false); setPreviewUnlocked(false);
  };

  const startBuild = (id: DemoAppId) => {
    clearTimers();
    const def = APPS[id];
    const buildDuration = randomBuildDuration();
    setPhase("matched");
    setAppId(id);
    setMessages([]); setCompletedSteps(new Set()); setRunningStep("understand"); setScanProgress(0);
    setEdited(false); setAgentActive(false); setPreviewUnlocked(false);

    // schedule phases
    TIMELINE.forEach(({ phase: p, at }) => {
      timers.current.push(setTimeout(() => setPhase(p), scaleBuildTime(at, buildDuration)));
    });

    // schedule chat
    def.chat.forEach((m) => {
      timers.current.push(setTimeout(() => setMessages((cur) => [...cur, m]), scaleBuildTime(m.delay, buildDuration)));
    });

    // schedule timeline step completions
    const stepSchedule: { id: string; complete: number; next: string | null }[] = [
      { id: "understand", complete: 2000, next: "sources" },
      { id: "sources",    complete: 5000, next: "scan" },
      { id: "scan",       complete: 12500, next: "design" },
      { id: "design",     complete: 15000, next: "generate" },
      { id: "generate",   complete: 19500, next: "connect" },
      { id: "connect",    complete: 22500, next: "actions" },
      { id: "actions",    complete: 25500, next: "test" },
      { id: "test",       complete: 29500, next: "ready" },
      { id: "ready",      complete: 30000, next: null },
    ];
    stepSchedule.forEach((s) => {
      timers.current.push(setTimeout(() => {
        setCompletedSteps((cur) => new Set(cur).add(s.id));
        setRunningStep(s.next);
      }, scaleBuildTime(s.complete, buildDuration)));
    });

    // schedule tool scan animation between 6s and 13s
    const tools = def.tools;
    const scanStart = scaleBuildTime(6500, buildDuration);
    const scanEnd = scaleBuildTime(12500, buildDuration);
    const slice = (scanEnd - scanStart) / tools.length;
    tools.forEach((_, i) => {
      timers.current.push(setTimeout(() => setScanProgress(i + 1), scanStart + slice * i));
    });

    timers.current.push(setTimeout(() => {
      setPreviewUnlocked(true);
      setPhase("preview_ready");
      toast.success("Preview ready", { description: `${def.name} is live.` });
    }, buildDuration));
  };

  const onSubmit = async () => {
    if (!prompt.trim()) return;
    setRouting(true);
    try {
      const result = await router({ data: { prompt } });
      startBuild(result.appId);
    } catch {
      startBuild("leaderboard");
    } finally {
      setRouting(false);
    }
  };

  const triggerEdit = () => {
    if (!app) return;
    setMessages((cur) => [
      ...cur,
      { id: "u-edit", delay: 0, content: `**You:** ${app.editPrompt}` },
      { id: "a-edit-start", delay: 0, content: "Applying that change now…" },
    ]);
    setPhase("editing");
    timers.current.push(setTimeout(() => {
      setPhase("edited"); setEdited(true);
      toast.success(app.editToast);
      setMessages((cur) => [...cur, { id: "a-edit-done", delay: 0, variant: "complete", content: `Done. **${app.editToast}.**` }]);
    }, 3000));
  };

  const triggerActivate = () => {
    if (!app) return;
    setMessages((cur) => [
      ...cur,
      { id: "u-act", delay: 0, content: `**You:** ${app.activatePrompt}` },
      { id: "a-act-start", delay: 0, content: "Setting up the workflow…" },
    ]);
    setPhase("activating");
    timers.current.push(setTimeout(() => {
      setPhase("agent_active"); setAgentActive(true);
      toast.success(app.activateToast);
      setMessages((cur) => [...cur, { id: "a-act-done", delay: 0, variant: "complete", content: `**${app.activateToast}.**` }]);
    }, 4200));
  };

  const triggerTweak = (text: string) => {
    const clean = text.trim();
    if (!clean || !app || tweaking) return;
    setTweakInput("");
    setTweaking(true);
    const uid = `u-tw-${Date.now()}`;
    const aid = `a-tw-${Date.now()}`;
    setMessages((cur) => [
      ...cur,
      { id: uid, delay: 0, content: `**You:** ${clean}` },
      { id: `${aid}-start`, delay: 0, content: "On it — applying that change now…" },
    ]);
    // small heuristic-driven response for variety
    const verbs = ["Updated", "Added", "Tweaked", "Adjusted", "Wired up"];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const summary = clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
    const delay = 1400 + Math.floor(Math.random() * 1400);
    timers.current.push(setTimeout(() => {
      setTweaks((cur) => [clean, ...cur].slice(0, 6));
      toast.success(`${verb}: ${summary}`);
      setMessages((cur) => [
        ...cur,
        { id: `${aid}-done`, delay: 0, variant: "complete", content: `Done. **${verb}** — ${summary}.` },
      ]);
      setTweaking(false);
    }, delay));
  };

  if (phase === "idle") {
    return (
      <IdleHero
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={onSubmit}
        routing={routing}
        onPickApp={(id) => { setPrompt(APPS[id].examplePrompt); startBuild(id); }}
      />
    );
  }

  if (!app) return null;
  const previewVisible = previewUnlocked && (
    phase === "preview_ready" || phase === "editing" || phase === "edited" || phase === "activating" || phase === "agent_active"
  );

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Chat panel */}
      <div className="flex w-[380px] shrink-0 flex-col border-r border-black/5 bg-[oklch(0.985_0_0)]">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[oklch(0.4_0_0)]">
            <span className="relative flex h-2 w-2">
              {!previewVisible && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.68_0.22_40)] opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${previewVisible ? "bg-emerald-500" : "bg-[oklch(0.68_0.22_40)]"}`} />
            </span>
            Beevr Build
            <span className="ml-1 rounded-full bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] normal-case tracking-normal text-[oklch(0.45_0_0)]">
              {prettyPhase(phase)}
            </span>
          </div>
          <button onClick={reset} className="clicky-sm rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-[oklch(0.4_0_0)] hover:bg-black/[0.04]">
            <RefreshCw className="mr-1 inline h-3 w-3" /> New build
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 text-xs">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">You</div>
            <div className="mt-1 text-[oklch(0.2_0_0)]">{prompt || app.examplePrompt}</div>
          </div>
          <div className="space-y-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} msg={m} />
            ))}
            {(!previewVisible || tweaking) && (
              <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2 text-xs text-[oklch(0.4_0_0)]">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[oklch(0.68_0.22_40)]" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[oklch(0.68_0.22_40)]" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[oklch(0.68_0.22_40)]" style={{ animationDelay: "240ms" }} />
                </span>
                <span className="font-medium">
                  {tweaking ? "Applying your change" : runningStep ? `${(STEPS.find(s => s.id === runningStep)?.label) ?? "Working"}` : "Thinking"}
                </span>
                <span className="ml-auto font-mono text-[10px] text-[oklch(0.55_0_0)]">Beevr</span>
              </div>
            )}
          </div>
        </div>

        {previewVisible ? (
          <div className="border-t border-black/5 bg-white p-3">
            <div className="mb-2 flex flex-wrap gap-1">
              {["Change the accent color", "Make the header bigger", "Add a search bar", "Show last 24h only"].map((s) => (
                <button
                  key={s}
                  onClick={() => triggerTweak(s)}
                  disabled={tweaking}
                  className="clicky-sm rounded-full border border-black/10 bg-[oklch(0.97_0_0)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.4_0_0)] hover:bg-black/[0.04] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-xl border border-black/10 bg-white p-2 focus-within:border-[oklch(0.68_0.22_40)]/40">
              <textarea
                value={tweakInput}
                onChange={(e) => setTweakInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    triggerTweak(tweakInput);
                  }
                }}
                placeholder="Ask Beevr to tweak the app…"
                rows={1}
                className="min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-xs text-[oklch(0.15_0_0)] outline-none placeholder:text-[oklch(0.55_0_0)]"
              />
              <button
                onClick={() => triggerTweak(tweakInput)}
                disabled={!tweakInput.trim() || tweaking}
                className="clicky-sm inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[oklch(0.68_0.22_40)] text-white shadow-sm hover:bg-[oklch(0.62_0.22_40)] disabled:opacity-40"
              >
                {tweaking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-black/5 p-3">
            <BuildTimeline running={runningStep} completed={completedSteps} />
          </div>
        )}
      </div>

      {/* Visualizer / preview */}
      <div className="relative flex-1 overflow-y-auto bg-[oklch(0.98_0.005_85)]">
        {!previewVisible ? (
          <BuildVisualizer phase={phase} app={app} scanProgress={scanProgress} />
        ) : (
          <PreviewWrapper
            app={app}
            edited={edited}
            agentActive={agentActive}
            phase={phase}
            onEdit={triggerEdit}
            onActivate={triggerActivate}
            tweaks={tweaks}
          />
        )}
      </div>
    </div>
  );
}


// =========================================================
// Idle hero
// =========================================================
function IdleHero({
  prompt, setPrompt, onSubmit, routing, onPickApp,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  onSubmit: () => void;
  routing: boolean;
  onPickApp: (id: DemoAppId) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-6 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)] shadow-sm">
          <Sparkles className="h-3 w-3" /> Beevr Build
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[oklch(0.15_0_0)]">What should we build today?</h1>
        <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">Describe an internal tool. Beevr will wire it up to your company data and ship a live preview.</p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm focus-within:border-[oklch(0.68_0.22_40)]/40 focus-within:shadow-md">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a leaderboard showing who is shipping the most this week…"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit(); }
            }}
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-[oklch(0.15_0_0)] outline-none placeholder:text-[oklch(0.55_0_0)]"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-[oklch(0.5_0_0)]">⌘+Enter to build</div>
            <button
              onClick={onSubmit}
              disabled={!prompt.trim() || routing}
              className="clicky inline-flex items-center gap-1.5 rounded-xl bg-[oklch(0.68_0.22_40)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-[oklch(0.62_0.22_40)] disabled:opacity-50"
            >
              {routing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {routing ? "Understanding…" : "Build"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">Or start from a template</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.values(APPS) as AppDef[]).map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => onPickApp(a.id)}
                className="clicky group rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm transition-all hover:border-[oklch(0.68_0.22_40)]/30 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: a.accent }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-semibold text-[oklch(0.15_0_0)]">{a.name}</div>
                <div className="mt-1 line-clamp-3 text-xs text-[oklch(0.45_0_0)]">{a.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Chat bubble
// =========================================================
function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.content.startsWith("**You:**");
  if (msg.variant === "plan" && msg.plan) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-3 text-xs animate-[fadeInUp_200ms_ease-out]">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)]">
          <Workflow className="h-3 w-3" /> Build plan
        </div>
        <ul className="space-y-1.5">
          {msg.plan.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[oklch(0.3_0_0)]">
              <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-black/15 bg-[oklch(0.97_0_0)]" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (msg.variant === "tool" && msg.tool) {
    const ok = msg.tool.status === "ok" || msg.tool.status === "passed";
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] animate-[fadeInUp_200ms_ease-out]">
        {ok ? <Check className="h-3 w-3 text-emerald-600" /> : <Loader2 className="h-3 w-3 animate-spin text-[oklch(0.68_0.22_40)]" />}
        <span className="font-mono text-[oklch(0.25_0_0)]">{msg.tool.name}</span>
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${ok ? "bg-emerald-500/10 text-emerald-700" : "bg-[oklch(0.97_0.04_60)] text-[oklch(0.68_0.22_40)]"}`}>{msg.tool.status}</span>
        {msg.tool.meta && <span className="ml-auto truncate text-[oklch(0.5_0_0)]">{msg.tool.meta}</span>}
      </div>
    );
  }
  if (msg.variant === "code" && msg.code) {
    return <CodeBubble code={msg.code} />;
  }
  return (
    <div className={`rounded-xl border p-3 text-xs animate-[fadeInUp_200ms_ease-out] ${
      isUser ? "border-[oklch(0.68_0.22_40)]/20 bg-[oklch(0.97_0.04_60)]" :
      msg.variant === "complete" ? "border-emerald-500/20 bg-emerald-500/5" : "border-black/10 bg-white"
    }`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">
        {isUser ? "You" : msg.variant === "complete" ? (
          <><Check className="h-3 w-3 text-emerald-600" /> Beevr · complete</>
        ) : (
          <><span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.68_0.22_40)] animate-pulse" /> Beevr</>
        )}
      </div>
      <StreamText className="mt-1 whitespace-pre-wrap text-[oklch(0.2_0_0)]" text={msg.content} instant={isUser || msg.variant === "complete"} />
    </div>
  );
}

function StreamText({ text, className, instant }: { text: string; className?: string; instant?: boolean }) {
  const [shown, setShown] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) { setShown(text.length); return; }
    setShown(0);
    const step = Math.max(2, Math.ceil(text.length / 60));
    const t = setInterval(() => {
      setShown((c) => {
        if (c >= text.length) { clearInterval(t); return c; }
        return Math.min(text.length, c + step);
      });
    }, 22);
    return () => clearInterval(t);
  }, [text, instant]);
  const visible = text.slice(0, shown);
  const done = shown >= text.length;
  return (
    <div className={className}>
      <span dangerouslySetInnerHTML={{ __html: renderMarkdown(visible) }} />
      {!done && <span className="ml-px inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.68_0.22_40)] align-middle" />}
    </div>
  );
}


function CodeBubble({ code }: { code: { lang: string; file: string; lines: string[] } }) {
  const [shown, setShown] = useState(0);
  const [charsOnCurrent, setCharsOnCurrent] = useState(0);
  useEffect(() => {
    if (shown >= code.lines.length) return;
    const line = code.lines[shown];
    if (charsOnCurrent < line.length) {
      const t = setTimeout(() => setCharsOnCurrent((c) => Math.min(c + Math.max(2, Math.ceil(line.length / 14)), line.length)), 28);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown((s) => s + 1); setCharsOnCurrent(0); }, 90);
    return () => clearTimeout(t);
  }, [shown, charsOnCurrent, code.lines]);
  const done = shown >= code.lines.length;
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-[oklch(0.16_0.01_260)] text-[oklch(0.92_0_0)] shadow-sm animate-[fadeInUp_200ms_ease-out]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-[10px]">
        <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-rose-400/70" /><span className="h-2 w-2 rounded-full bg-amber-400/70" /><span className="h-2 w-2 rounded-full bg-emerald-400/70" /></div>
        <span className="font-mono text-[oklch(0.7_0_0)]">{code.file}</span>
        <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase">{code.lang}</span>
        {!done && <Loader2 className="h-3 w-3 animate-spin text-[oklch(0.85_0.15_60)]" />}
        {done && <Check className="h-3 w-3 text-emerald-400" />}
      </div>
      <pre className="overflow-x-auto px-3 py-2 font-mono text-[10.5px] leading-relaxed">
        {code.lines.slice(0, shown).map((l, i) => (
          <div key={i} className="flex"><span className="mr-2 w-4 shrink-0 select-none text-right text-white/30">{i + 1}</span><span>{l || " "}</span></div>
        ))}
        {!done && (
          <div className="flex"><span className="mr-2 w-4 shrink-0 select-none text-right text-white/30">{shown + 1}</span><span>{code.lines[shown]?.slice(0, charsOnCurrent)}<span className="ml-px inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.85_0.15_60)] align-middle" /></span></div>
        )}
      </pre>
    </div>
  );
}


function renderMarkdown(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// =========================================================
// Build timeline
// =========================================================
function BuildTimeline({ running, completed }: { running: string | null; completed: Set<string> }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">
        <Cpu className="h-3 w-3" /> Live build
      </div>
      <ul className="space-y-1.5">
        {STEPS.map((s) => {
          const isDone = completed.has(s.id);
          const isRunning = running === s.id;
          return (
            <li key={s.id} className="flex items-center gap-2 text-[11px]">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                isDone ? "bg-emerald-500 text-white" : isRunning ? "bg-[oklch(0.68_0.22_40)] text-white" : "border border-black/15 bg-white"
              }`}>
                {isDone ? <Check className="h-2.5 w-2.5" /> : isRunning ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
              </span>
              <span className={`${isDone ? "text-[oklch(0.3_0_0)]" : isRunning ? "font-semibold text-[oklch(0.2_0_0)]" : "text-[oklch(0.55_0_0)]"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// =========================================================
// Visualizer (planning / scanning / generating / backend / testing)
// =========================================================
function BuildVisualizer({ phase, app, scanProgress }: { phase: Phase; app: AppDef; scanProgress: number }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-3 px-6 py-6">
      {/* Faux browser frame — preview is compiling */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/5 bg-[oklch(0.98_0_0)] px-3 py-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-md border border-black/5 bg-white px-2 py-1 text-[10.5px] text-[oklch(0.45_0_0)]">
            <Cloud className="h-3 w-3" />
            <span className="truncate font-mono">beevr.app/preview/{app.id}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-sm bg-[oklch(0.97_0.04_60)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)]">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> {prettyPhase(phase)}
            </span>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto bg-[oklch(0.985_0.005_85)] px-5 py-5">
          {/* Header skeleton */}
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: app.accent }}>
                <app.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="h-3 w-40 rounded bg-black/10" />
                <div className="mt-1.5 h-2 w-28 rounded bg-black/5" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-6 w-20 rounded-md bg-black/10" />
              <div className="h-6 w-16 rounded-md bg-[oklch(0.68_0.22_40)]/30" />
            </div>
          </div>

          {/* Metric cards */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                <div className="h-2 w-14 rounded bg-black/10" />
                <div className="mt-2 h-6 w-20 rounded bg-black/10 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                <div className="mt-1.5 h-2 w-10 rounded bg-emerald-500/30" />
              </div>
            ))}
          </div>

          {/* Big panels */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
            <div className="md:col-span-2 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-24 rounded bg-black/10" />
                <div className="h-5 w-14 rounded bg-black/5" />
              </div>
              <div className="mt-3 flex h-44 items-end gap-1.5">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-[oklch(0.68_0.22_40)]/20 animate-pulse"
                    style={{ height: `${20 + ((i * 37) % 70)}%`, animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
              <div className="h-2.5 w-20 rounded bg-black/10" />
              <div className="mt-3 space-y-2">
                {[0,1,2,3,4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-black/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 w-3/4 rounded bg-black/10" />
                      <div className="h-2 w-1/2 rounded bg-black/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="h-2.5 w-28 rounded bg-black/10" />
              <div className="h-5 w-20 rounded bg-black/5" />
            </div>
            {[0,1,2,3].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-2 border-b border-black/5 py-2 last:border-0">
                {[0,1,2,3,4].map((c) => (
                  <div key={c} className={`h-2.5 rounded bg-black/10 ${c === 0 ? "w-3/4" : "w-full"}`} style={{ opacity: 0.4 + ((i + c) % 4) * 0.15 }} />
                ))}
              </div>
            ))}
          </div>

          {/* Overlay shimmer */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/0 to-white/40" />

          {/* Phase pill bottom */}
          <div className="pointer-events-none sticky bottom-0 mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[oklch(0.3_0_0)] shadow-md backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin text-[oklch(0.68_0.22_40)]" />
              {phase === "scanning" && `Scanning ${app.tools[Math.min(scanProgress, app.tools.length - 1)]?.name ?? "sources"}…`}
              {phase === "matched" && "Matching app to your prompt…"}
              {phase === "planning" && "Drafting build plan…"}
              {phase === "generating_ui" && "Rendering views & components…"}
              {phase === "creating_backend" && "Provisioning backend · migrations · functions…"}
              {phase === "testing" && "Running preview checks…"}
              {phase === "preview_ready" && "Booting preview…"}
              <span className="font-mono text-[10px] text-[oklch(0.5_0_0)]">· {prettyPhase(phase)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Live IDE — file tabs + streaming code editor + terminal
// =========================================================
type IdeFile = { delay: number; file: string; lang: string; lines: string[] };

function LiveBuildIDE({ app, phase }: { app: AppDef; phase: Phase }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const i = setInterval(() => setElapsed(Date.now() - startRef.current), 90);
    return () => clearInterval(i);
  }, [app.id]);

  const files: IdeFile[] = useMemo(
    () =>
      app.chat
        .filter((m) => m.variant === "code" && m.code)
        .map((m) => ({ delay: m.delay, ...(m.code as { file: string; lang: string; lines: string[] }) })),
    [app.id],
  );

  const opened = files.filter((f) => elapsed >= f.delay);
  const active = opened[opened.length - 1];
  const TYPING_MS = 3200;

  const typedLines = useMemo(() => {
    if (!active) return [] as string[];
    const totalChars = active.lines.join("\n").length;
    const t = Math.max(0, elapsed - active.delay);
    const ratio = Math.min(1, t / TYPING_MS);
    const chars = Math.floor(totalChars * ratio);
    let remaining = chars;
    const out: string[] = [];
    for (const ln of active.lines) {
      if (remaining <= 0) break;
      if (remaining >= ln.length) {
        out.push(ln);
        remaining -= ln.length + 1;
      } else {
        out.push(ln.slice(0, remaining));
        remaining = 0;
      }
    }
    return out;
  }, [active, elapsed]);
  const activeDone = active ? elapsed - active.delay >= TYPING_MS : false;

  const log = useTerminalLog(app, elapsed, phase);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-2">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-[oklch(0.16_0.01_260)] text-[oklch(0.92_0_0)] shadow-lg">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-[oklch(0.13_0.01_260)] px-2 py-1.5">
          <div className="mr-2 flex shrink-0 gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </div>
          {opened.length === 0 ? (
            <span className="font-mono text-[10px] text-white/40">waiting for files…</span>
          ) : (
            opened.map((f) => {
              const isActive = f === active;
              const done = elapsed - f.delay >= TYPING_MS;
              return (
                <div
                  key={f.file}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] ${
                    isActive ? "bg-[oklch(0.22_0.01_260)] text-white" : "text-white/55"
                  }`}
                >
                  <span className="truncate">{f.file}</span>
                  {done ? (
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />
                  ) : null}
                </div>
              );
            })
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1 pl-2 font-mono text-[9px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            beevr · agent
          </div>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
          {!active ? (
            <span className="text-white/40">{`// Beevr is preparing files…`}</span>
          ) : (
            <>
              {typedLines.map((l, i) => {
                const isLast = i === typedLines.length - 1;
                return (
                  <div key={i} className="flex">
                    <span className="mr-3 w-5 shrink-0 select-none text-right text-white/25">{i + 1}</span>
                    <span className={syntax(l)}>
                      {l || " "}
                      {isLast && !activeDone && (
                        <span className="ml-px inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.85_0.15_60)] align-middle" />
                      )}
                    </span>
                  </div>
                );
              })}
              {typedLines.length === 0 && (
                <span className="inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.85_0.15_60)] align-middle" />
              )}
            </>
          )}
        </pre>
      </div>
      <div className="overflow-hidden rounded-xl border border-black/10 bg-[oklch(0.08_0_0)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          beevr · build log
          <span className="ml-auto font-mono text-[9px] text-white/40">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
        <div className="max-h-36 overflow-y-auto px-3 py-1.5 font-mono text-[10.5px] leading-relaxed">
          {log.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-10 shrink-0 text-white/30">{l.t}</span>
              <span className={l.cls}>{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function syntax(line: string): string {
  const t = line.trim();
  if (t.startsWith("//") || t.startsWith("#")) return "text-white/35 italic";
  if (/^(import|export|from|const|let|return|async|await|on|function|interface|type|for|if)\b/.test(t)) return "text-[oklch(0.85_0.15_300)]";
  if (t.startsWith("<") || t.startsWith("</")) return "text-[oklch(0.8_0.15_25)]";
  return "text-[oklch(0.92_0_0)]";
}

function useTerminalLog(app: AppDef, elapsed: number, _phase: Phase) {
  return useMemo(() => {
    const fmtT = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
    const entries: { at: number; text: string; cls: string }[] = [];
    const push = (at: number, text: string, cls = "text-emerald-200/85") => entries.push({ at, text, cls });

    push(200, `$ beevr build "${app.examplePrompt.slice(0, 48)}…"`, "text-white/80");
    push(700, `→ matched template · ${app.name}`, "text-[oklch(0.85_0.15_60)]");
    push(1400, "✓ workspace initialized · t3.micro · isolated sandbox");
    push(2200, "→ planning 8 steps", "text-white/70");
    push(3200, "✓ plan accepted · 8 steps queued");
    push(4200, "→ scanning connected tools", "text-white/70");
    app.tools.forEach((t, i) => {
      push(5000 + i * 900, `  fetch ${t.name.toLowerCase().replace(/\s+/g, "_")} … ${t.records}`);
    });
    push(12200, `✓ ${app.tools.length} sources scanned · 62 snippets embedded`);
    push(13200, "→ generating ui", "text-white/70");
    push(14000, "vite: created views/ layout · 3 components");
    push(15200, "vite: compiled in 412ms · hmr ready");
    push(16400, "writing views/health.tsx · 84 lines");
    push(18200, "writing components/MetricCard.tsx · 41 lines");
    push(19600, "✓ ui generated · 6 components · 312 loc");
    push(20400, "→ wiring backend", "text-white/70");
    push(21200, "supabase: applying migration 20260622_init.sql");
    push(22400, "supabase: migration ok · 3 tables · rls enabled");
    push(23200, "deploying edge function · agents/handler");
    push(24400, "✓ function deployed · 218ms cold start");
    push(25600, "→ running preview checks", "text-white/70");
    push(26400, "  lint: 0 errors · 0 warnings");
    push(27000, "  bindings: 18/18 connected");
    push(27800, "  actions: 6/6 reachable");
    push(28600, "  a11y: 100");
    push(29400, "✓ all checks passed · 412ms");
    push(30000, "✓ preview ready · live at /app/build", "text-emerald-300");

    return entries
      .filter((e) => elapsed >= e.at)
      .slice(-14)
      .map((e) => ({ t: fmtT(e.at), text: e.text, cls: e.cls }));
  }, [app, elapsed]);
}

function prettyPhase(p: Phase) {
  return ({
    matched: "Understanding", planning: "Planning", scanning: "Scanning tools",
    generating_ui: "Generating UI", creating_backend: "Wiring backend",
    testing: "Testing", preview_ready: "Ready",
    editing: "Editing", edited: "Edit applied", activating: "Activating",
    agent_active: "Agent active", idle: "Idle",
  } as Record<Phase, string>)[p];
}

// =========================================================
// Skeleton canvas (used during generating + backend phases)
// =========================================================
function SkeletonCanvas({ app, fadedReal = false }: { app: AppDef; fadedReal?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg" style={{ background: app.accent }} />
          <div className="h-3 w-32 rounded bg-black/10" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 rounded-md bg-black/10" />
          <div className="h-6 w-12 rounded-md bg-black/10" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[0,1,2,3].map((i) => (
          <div key={i} className="rounded-lg border border-black/5 bg-[oklch(0.98_0_0)] p-3">
            <div className={`h-2 w-12 rounded ${fadedReal ? "bg-[oklch(0.68_0.22_40)]/40" : "bg-black/10"}`} />
            <div className={`mt-2 h-5 w-16 rounded ${fadedReal ? "bg-black/30 animate-pulse" : "bg-black/15"}`} />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="col-span-2 h-40 rounded-lg border border-black/5 bg-[oklch(0.98_0_0)] animate-pulse" />
        <div className="h-40 rounded-lg border border-black/5 bg-[oklch(0.98_0_0)] animate-pulse" />
      </div>
      <div className="mt-2 h-24 rounded-lg border border-black/5 bg-[oklch(0.98_0_0)] animate-pulse" />
    </div>
  );
}

// =========================================================
// Preview wrapper + 3 hardcoded apps
// =========================================================
function PreviewWrapper({
  app, edited, agentActive, phase, onEdit, onActivate, tweaks,
}: { app: AppDef; edited: boolean; agentActive: boolean; phase: Phase; onEdit: () => void; onActivate: () => void; tweaks: string[] }) {
  const editing = phase === "editing" || phase === "activating";
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Preview ready
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{app.name}</h2>
          <p className="text-xs text-[oklch(0.45_0_0)]">{app.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!edited && (
            <button onClick={onEdit} disabled={editing} className="clicky-sm rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.25_0_0)] hover:bg-black/[0.04] disabled:opacity-50">
              <Sparkles className="mr-1 inline h-3 w-3 text-[oklch(0.68_0.22_40)]" /> {app.editChip}
            </button>
          )}
          {edited && !agentActive && (
            <button onClick={onActivate} disabled={editing} className="clicky rounded-lg bg-[oklch(0.68_0.22_40)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[oklch(0.62_0.22_40)] disabled:opacity-50">
              <Zap className="mr-1 inline h-3 w-3" /> {app.activateChip}
            </button>
          )}
          {agentActive && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <BellRing className="h-3 w-3" /> Agent active
            </span>
          )}
        </div>
      </div>

      {tweaks.length > 0 && (
        <div className="mb-4 rounded-2xl border border-[oklch(0.68_0.22_40)]/20 bg-[oklch(0.99_0.02_60)] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)]">
            <Sparkles className="h-3 w-3" /> Recent edits · just shipped
          </div>
          <ul className="space-y-1">
            {tweaks.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[oklch(0.25_0_0)]">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`transition-opacity ${editing ? "opacity-60" : "opacity-100"}`}>
        {app.id === "phone" && <PhoneLineApp edited={edited} agentActive={agentActive} />}
        {app.id === "leaderboard" && <LeaderboardApp edited={edited} agentActive={agentActive} />}
        {app.id === "bugs" && <BugsApp edited={edited} agentActive={agentActive} />}
      </div>
    </div>
  );
}

// ---------- Phone line ----------
function PhoneLineApp({ edited, agentActive }: { edited: boolean; agentActive: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Metric label="Active number" value="+1 (872) 666-9131" sub={agentActive ? "Live · accepting calls" : "Provisioned · ready"} />
        <Metric label="Calls today" value="0" sub="line just went live" />
        <Metric label="Leads captured" value="0" sub="awaiting first lead" />
        <Metric label="Escalations" value="0" sub="none yet" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card title="Greeting · live preview" className="md:col-span-2">
          <p className="text-sm text-[oklch(0.25_0_0)]">"Hi, this is Beevr. I can help with product questions, pricing, demos, or connect you to a teammate. What's up?"</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Pricing","Product","Demo","Status","Talk to human"].map(t => (
              <span key={t} className="rounded-md border border-black/10 bg-[oklch(0.97_0_0)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.35_0_0)]">{t}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[oklch(0.68_0.18_250)]/20 bg-[oklch(0.97_0.03_250)] px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[oklch(0.68_0.18_250)] text-white">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div className="flex h-7 flex-1 items-center gap-[2px]">
              {Array.from({ length: 36 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-[oklch(0.68_0.18_250)]/70"
                  style={{
                    height: `${20 + Math.abs(Math.sin(i * 0.6)) * 70 + (i % 5) * 4}%`,
                    animation: "pulse 1.4s ease-in-out infinite",
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-[oklch(0.4_0_0)]">0:08 · sample</span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Line live at <span className="font-mono font-semibold">+1 (872) 666-9131</span> · ready to take the first call
          </div>
        </Card>
        <Card title="Knowledge sources">
          <ul className="space-y-1.5 text-xs">
            {[
              ["beevr.dev", "14 pages"],
              ["Product docs", "23 docs"],
              ["FAQ from Gmail", "38 Q&A"],
              ["Slack #product", "17 notes"],
            ].map(([n, c]) => (
              <li key={n} className="flex items-center justify-between">
                <span className="text-[oklch(0.25_0_0)]">{n}</span>
                <span className="rounded-md bg-[oklch(0.97_0_0)] px-1.5 py-0.5 font-mono text-[10px] text-[oklch(0.45_0_0)]">{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-black/5 pt-2 text-[10px] text-[oklch(0.5_0_0)]">
            Re-indexed <span className="font-semibold text-[oklch(0.3_0_0)]">2 min ago</span> · auto-refresh hourly
          </div>
        </Card>
      </div>

      <Card title="Call log" right={<button className="clicky-sm rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-medium hover:bg-black/[0.04]"><PhoneIncoming className="mr-1 inline h-3 w-3" /> Simulate incoming call</button>}>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.97_0_0)] text-[oklch(0.55_0_0)]">
            <Phone className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium text-[oklch(0.25_0_0)]">No calls yet</div>
          <div className="text-[11px] text-[oklch(0.5_0_0)]">Calls to <span className="font-mono">+1 (872) 666-9131</span> will appear here in realtime.</div>
          {edited && <div className="mt-1 rounded bg-[oklch(0.97_0.04_60)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[oklch(0.68_0.22_40)]">Demo booking flow ready</div>}
        </div>
      </Card>



      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title={edited ? "Workflows · Demo booking" : "Lead capture"}>
          {edited ? (
            <div className="space-y-1.5 text-xs text-[oklch(0.3_0_0)]">
              <Row label="Trigger" value="Caller asks for a demo" />
              <Row label="Ask" value="Preferred time, email, company" />
              <Row label="Create" value="Calendar invite + Slack ping" />
              <Row label="Confirm" value="SMS confirmation to caller" />
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-[oklch(0.3_0_0)]">
              <Row label="Capture" value="Name · Company · Reason" />
              <Row label="Route" value="Slack #sales-leads" />
              <Row label="CRM" value="Create lead in HubSpot" />
            </div>
          )}
        </Card>
        <Card title="Escalation rules">
          <div className="space-y-1.5 text-xs text-[oklch(0.3_0_0)]">
            <Row label="If" value="Caller frustrated or asks for human" />
            <Row label="If" value="Question outside knowledge base" />
            <Row label="Then" value="Warm-transfer + post summary to #support" />
          </div>
        </Card>
      </div>

      {agentActive && (
        <Card title="Active agent">
          <Row label="Phone line" value="+1 (872) 666-9131 · accepting calls" />
          <Row label="Slack summaries" value="Posting to #support after each call" />
          <Row label="Lead routing" value="Active" />
        </Card>
      )}
    </div>
  );
}

// ---------- Builder leaderboard ----------
function LeaderboardApp({ edited, agentActive }: { edited: boolean; agentActive: boolean }) {
  const builders = [
    { name: "Adithya R.", features: 5, tokens: 412000, lines: 3920, prs: 3, delta: 2, color: "oklch(0.68 0.18 250)" },
    { name: "Maya C.",    features: 4, tokens: 388000, lines: 3110, prs: 2, delta: 1, color: "oklch(0.68 0.22 40)" },
    { name: "Jordan P.",  features: 3, tokens: 305000, lines: 2680, prs: 2, delta: -1, color: "oklch(0.65 0.18 150)" },
    { name: "Priya S.",   features: 3, tokens: 244000, lines: 2055, prs: 1, delta: 3, color: "oklch(0.68 0.18 310)" },
    { name: "Sam W.",     features: 2, tokens: 198000, lines: 1480, prs: 2, delta: 0, color: "oklch(0.68 0.16 90)" },
    { name: "Lena P.",    features: 1, tokens: 138000, lines: 905,  prs: 1, delta: -2, color: "oklch(0.62 0.18 25)" },
  ];
  const tokenSeries = [
    { d: "Mon", t: 220 }, { d: "Tue", t: 305 }, { d: "Wed", t: 268 },
    { d: "Thu", t: 410 }, { d: "Fri", t: 372 }, { d: "Sat", t: 142 }, { d: "Sun", t: 83 },
  ];
  const shipped = [
    { f: "Voice transcripts v2",   who: "Adithya R.", when: "Mon" },
    { f: "MCP tool catalog",       who: "Maya C.",    when: "Tue" },
    { f: "Per-workspace billing",  who: "Jordan P.",  when: "Wed" },
    { f: "Approvals UI redesign",  who: "Priya S.",   when: "Thu" },
  ];
  const maxTokens = Math.max(...builders.map(b => b.tokens));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Active builders" value="8" sub="this week" />
        <Metric label="Features in progress" value="18" sub="+4 vs last week" />
        <Metric label="Tokens used" value="1.8M" sub="across OpenCode runs" />
        <Metric label="Lines changed" value="14.2K" sub="11 active PRs" />
      </div>

      <Card title="Leaderboard" right={<span className="rounded-md bg-[oklch(0.97_0_0)] px-1.5 py-0.5 font-mono text-[10px] text-[oklch(0.45_0_0)]">last 7 days</span>}>
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[oklch(0.5_0_0)]">
            <tr><th className="py-1.5 w-8">#</th><th>Builder</th><th>Features</th><th className="min-w-[140px]">Tokens</th><th>Lines</th><th>PRs</th></tr>
          </thead>
          <tbody>
            {builders.map((b, i) => {
              const initials = b.name.split(" ").map(p => p[0]).join("").slice(0,2);
              const pct = (b.tokens / maxTokens) * 100;
              const deltaUp = b.delta > 0, deltaDown = b.delta < 0;
              return (
                <tr key={b.name} className="border-t border-black/5">
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-[oklch(0.4_0_0)]">{i + 1}</span>
                      {deltaUp && <span className="text-[9px] font-bold text-emerald-600">▲{b.delta}</span>}
                      {deltaDown && <span className="text-[9px] font-bold text-rose-600">▼{Math.abs(b.delta)}</span>}
                      {b.delta === 0 && <span className="text-[9px] text-[oklch(0.6_0_0)]">—</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm" style={{ background: b.color }}>{initials}</span>
                      <span className="font-medium text-[oklch(0.2_0_0)]">{b.name}</span>
                    </div>
                  </td>
                  <td className="text-[oklch(0.3_0_0)]">{b.features}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/5">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                      <span className="font-mono text-[oklch(0.3_0_0)]">{(b.tokens / 1000).toFixed(0)}K</span>
                    </div>
                  </td>
                  <td className="text-[oklch(0.3_0_0)]">{b.lines.toLocaleString()}</td>
                  <td>
                    <span className="rounded-md bg-[oklch(0.97_0.04_60)] px-1.5 py-0.5 text-[10px] font-semibold text-[oklch(0.68_0.22_40)]">{b.prs}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>


      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Token usage (this week)">
          <div className="h-44">
            <ResponsiveContainer>
              <AreaChart data={tokenSeries}>
                <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="oklch(0.5 0 0)" fontSize={10} />
                <YAxis stroke="oklch(0.5 0 0)" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="t" stroke="oklch(0.68 0.22 40)" fill="oklch(0.68 0.22 40 / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Lines changed by builder">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={builders.map(b => ({ name: b.name.split(" ")[0], lines: b.lines }))}>
                <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={10} />
                <YAxis stroke="oklch(0.5 0 0)" fontSize={10} />
                <Tooltip />
                <Bar dataKey="lines" fill="oklch(0.68 0.18 250)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {edited && (
        <Card title="Shipped this week" right={<span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">New view</span>}>
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-[oklch(0.5_0_0)]">
              <tr><th className="py-1.5">Feature</th><th>By</th><th>Shipped</th></tr>
            </thead>
            <tbody>
              {shipped.map((s) => (
                <tr key={s.f} className="border-t border-black/5">
                  <td className="py-2 text-[oklch(0.2_0_0)]">{s.f}</td>
                  <td className="text-[oklch(0.3_0_0)]">{s.who}</td>
                  <td className="text-[oklch(0.45_0_0)]">{s.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {agentActive && (
        <Card title="Weekly Builder Report agent">
          <Row label="Schedule" value="Every Friday 5:00 PM PT" />
          <Row label="Channel" value="#build" />
          <Row label="Includes" value="Top builders · features shipped · token usage · PR velocity" />
        </Card>
      )}
    </div>
  );
}

// ---------- Bugs dashboard ----------
function BugsApp({ edited, agentActive }: { edited: boolean; agentActive: boolean }) {
  const bugsRaw = [
    { title: "Voice agent drops after 60s",       sev: "Critical", users: 12, pilot: true,  src: "Logs",   seen: "2h ago",   trend: [3,5,4,7,9,12,14] },
    { title: "MCP tools list returns 500",        sev: "Critical", users: 4,  pilot: true,  src: "GitHub", seen: "5h ago",   trend: [0,1,2,2,3,4,4] },
    { title: "Onboarding loop on Safari iOS",     sev: "High",     users: 18, pilot: false, src: "Linear", seen: "1d ago",   trend: [4,6,8,11,14,16,18] },
    { title: "Approvals never resolve",           sev: "Critical", users: 3,  pilot: true,  src: "Slack",  seen: "3h ago",   trend: [1,1,2,2,2,3,3] },
    { title: "Stale workspace name in sidebar",   sev: "Low",      users: 22, pilot: false, src: "Gmail",  seen: "4d ago",   trend: [12,14,15,17,19,20,22] },
    { title: "Token usage chart off by 1 day",    sev: "Med",      users: 9,  pilot: false, src: "Linear", seen: "12h ago",  trend: [2,3,4,5,7,8,9] },
  ];
  const bugs = edited ? [...bugsRaw].sort((a, b) => Number(b.pilot) - Number(a.pilot)) : bugsRaw;
  const sevColor = (s: string) =>
    s === "Critical" ? "oklch(0.62 0.22 25)" :
    s === "High"     ? "oklch(0.72 0.18 65)" :
    s === "Med"      ? "oklch(0.78 0.16 95)" :
                       "oklch(0.75 0.02 250)";
  const errors = [
    { d: "Mon", e: 22 }, { d: "Tue", e: 31 }, { d: "Wed", e: 28 },
    { d: "Thu", e: 54 }, { d: "Fri", e: 38 }, { d: "Sat", e: 41 }, { d: "Sun", e: 32 },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Open bugs" value="18" sub="5 critical" />
        <Metric label="Pilot-blocking" value="3" sub="affects 19 users" />
        <Metric label="Runtime errors" value="246" sub="last 7d" />
        <Metric label="Sessions" value="1,284" sub="92% successful runs" />
      </div>

      {edited && (
        <Card title="Pilot blockers" right={<span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">Prioritized</span>}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {bugs.filter(b => b.pilot).map(b => (
              <div key={b.title} className="relative overflow-hidden rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 pl-3">
                <span className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </span>
                  {b.sev}
                </div>
                <div className="mt-1 text-xs font-semibold text-[oklch(0.2_0_0)]">{b.title}</div>
                <div className="mt-1 text-[10px] text-[oklch(0.5_0_0)]">{b.users} users · via {b.src} · first seen {b.seen}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="All bugs">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[oklch(0.5_0_0)]">
            <tr><th className="py-1.5 w-1"></th><th>Title</th><th>Severity</th><th>Users</th><th>Trend (7d)</th><th>First seen</th><th>Source</th><th>Pilot</th></tr>
          </thead>
          <tbody>
            {bugs.map((b) => {
              const max = Math.max(...b.trend);
              return (
                <tr key={b.title} className="border-t border-black/5">
                  <td className="py-2"><span className="block h-5 w-1 rounded-sm" style={{ background: sevColor(b.sev) }} /></td>
                  <td className="text-[oklch(0.2_0_0)]">{b.title}</td>
                  <td>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      b.sev === "Critical" ? "bg-rose-500/10 text-rose-700" :
                      b.sev === "High" ? "bg-amber-500/10 text-amber-700" :
                      b.sev === "Med" ? "bg-yellow-500/10 text-yellow-700" :
                      "bg-black/5 text-[oklch(0.4_0_0)]"
                    }`}>{b.sev}</span>
                  </td>
                  <td className="text-[oklch(0.3_0_0)]">{b.users}</td>
                  <td>
                    <div className="flex h-5 items-end gap-[2px]">
                      {b.trend.map((v, i) => (
                        <span key={i} className="w-[3px] rounded-sm" style={{ height: `${10 + (v / max) * 90}%`, background: sevColor(b.sev), opacity: 0.4 + (i / b.trend.length) * 0.6 }} />
                      ))}
                    </div>
                  </td>
                  <td className="font-mono text-[10px] text-[oklch(0.5_0_0)]">{b.seen}</td>
                  <td className="text-[oklch(0.45_0_0)]">{b.src}</td>
                  <td>{b.pilot ? <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-rose-700">Pilot</span> : <span className="text-[oklch(0.7_0_0)]">·</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>


      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Runtime errors">
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={errors}>
                <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="oklch(0.5 0 0)" fontSize={10} />
                <YAxis stroke="oklch(0.5 0 0)" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="e" stroke="oklch(0.62 0.22 25)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Affected users">
          <ul className="space-y-1.5 text-xs">
            {[
              ["acme-corp",      "9 users · pilot"],
              ["northwind",      "5 users · pilot"],
              ["initech",        "4 users · pilot"],
              ["umbrella",       "11 users"],
              ["wayne-industries","8 users"],
            ].map(([n, c]) => (
              <li key={n} className="flex items-center justify-between border-b border-black/5 pb-1.5 last:border-0">
                <span className="text-[oklch(0.25_0_0)]">{n}</span>
                <span className="text-[oklch(0.5_0_0)]">{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={agentActive ? "Pilot Bug Alert agent · active" : "Alert rules"}>
        <div className="space-y-1.5 text-xs text-[oklch(0.3_0_0)]">
          <Row label="If" value="Critical bug affects a pilot customer" />
          <Row label="Then" value="Alert #engineering with stack + affected users" />
          <Row label="Also" value="Open Linear ticket tagged 'pilot-blocker'" />
          {agentActive && <Row label="Status" value="Realtime monitor running" />}
        </div>
      </Card>
    </div>
  );
}

// =========================================================
// Shared small UI
// =========================================================
function Card({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-[oklch(0.15_0_0)]">{value}</div>
      <div className="text-[10px] text-[oklch(0.55_0_0)]">{sub}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-black/5 py-1 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">{label}</span>
      <span className="text-right text-[oklch(0.25_0_0)]">{value}</span>
    </div>
  );
}

// satisfy linter — used in some configs
void useMemo; void TrendingUp; void Users; void PlayCircle;
