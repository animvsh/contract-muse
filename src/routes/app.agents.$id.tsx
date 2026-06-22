import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  ListTree,
  Send,
  Calendar,
  Webhook,
  Zap,
  MousePointerClick,
  Bot,
  Check,
  Sparkles,
  X,
  Save,
  GitBranch,
  CircleDot,
  ChevronDown,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/$id")({
  component: AgentDetail,
});

type AgentStep = { title: string; integration: string; action: string; x?: number; y?: number };
type AgentTrigger = { type: string; description: string; x?: number; y?: number };
type AgentSpec = { trigger: AgentTrigger; steps: AgentStep[] };
type Agent = {
  id: string;
  name: string;
  description: string | null;
  spec: AgentSpec;
  runs_count: number;
};
type Run = { id: string; log: string; created_at: string };

const INTEGRATIONS = ["Notion", "Slack", "Gmail", "Drive", "Linear", "GitHub", "HubSpot", "Stripe", "Zoom", "Figma"];
const TRIGGER_TYPES = ["manual", "schedule", "webhook", "event"] as const;

const triggerIcon = (type: string) => {
  if (type === "schedule") return Calendar;
  if (type === "webhook") return Webhook;
  if (type === "event") return Zap;
  return MousePointerClick;
};

function AgentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<"logs" | "chat">("logs");
  const [editing, setEditing] = useState<{ kind: "trigger" } | { kind: "step"; index: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const [{ data: a, error: agentError }, { data: r, error: runsError }] = await Promise.all([
      supabase.from("agents").select("*").eq("id", id).single(),
      supabase.from("agent_runs").select("*").eq("agent_id", id).order("created_at", { ascending: false }).limit(10),
    ]);
    if (agentError || !a) {
      setAgent(null);
      setRuns([]);
      setLoadError("Agent not found — redirecting to your agents.");
      setLoading(false);
      toast.error("Agent not found");
      navigate({ to: "/app/agents", replace: true });
      return;
    }
    const normalized = normalizeAgent(a as unknown as Agent);
    setAgent(normalized);
    const real = runsError ? [] : ((r as Run[] | null) ?? []);
    setRuns(real.length === 0 ? buildMockRuns(normalized) : real);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const persistSpec = async (nextSpec: AgentSpec, nextName?: string, nextDescription?: string | null) => {
    if (!agent) return;
    const optimistic: Agent = {
      ...agent,
      spec: nextSpec,
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(nextDescription !== undefined ? { description: nextDescription } : {}),
    };
    setAgent(optimistic);
    setSaving(true);
    const update: { spec: AgentSpec; name?: string; description?: string | null } = { spec: nextSpec };
    if (nextName !== undefined) update.name = nextName;
    if (nextDescription !== undefined) update.description = nextDescription;
    const { error } = await supabase.from("agents").update(update as never).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save changes");
      load();
    }
  };

  const handleRun = async () => {
    if (!agent || running) return;
    setRunning(true);
    setTab("logs");
    const allSteps = agent.spec.steps ?? [];
    const trig = agent.spec.trigger ?? { type: "manual", description: "Run on demand" };
    const startedAt = new Date().toISOString();
    const runId = `live-${Date.now()}`;
    const lines: string[] = [];
    const summary = `Live run · ${trig.type ?? "manual"} trigger`;
    const pushLog = () => {
      setRuns((cur) => {
        const next = cur.filter((r) => r.id !== runId);
        return [{ id: runId, created_at: startedAt, log: `${summary}\n\n${lines.join("\n")}` }, ...next];
      });
    };

    setActiveIndex(0);
    lines.push(`• [${new Date().toLocaleTimeString()}] Trigger fired — ${trig.description || trig.type || "manual run"}`);
    pushLog();
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < allSteps.length; i++) {
      setActiveIndex(i + 1);
      const s = allSteps[i];
      lines.push(`• [${new Date().toLocaleTimeString()}] → ${s.integration}: ${s.title}`);
      pushLog();
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      lines.push(`    ↳ ${s.action} · 200 OK`);
      pushLog();
      await new Promise((r) => setTimeout(r, 250));
    }

    setActiveIndex(-1);
    lines.push(`• [${new Date().toLocaleTimeString()}] Completed in ${(allSteps.length * 0.8 + 0.6).toFixed(1)}s`);
    pushLog();

    // Best-effort persist; ignore failures so the demo always feels live.
    try {
      const { data: userRes } = await supabase.auth.getCurrentUser();
      const uid = userRes.user?.id;
      if (uid) {
        await supabase.from("agent_runs").insert({
          agent_id: id,
          user_id: uid,
          log: `${summary}\n\n${lines.join("\n")}`,
          status: "completed",
        });
        await supabase
          .from("agents")
          .update({ runs_count: (agent.runs_count ?? 0) + 1 })
          .eq("id", id);
      }
    } catch { /* mock-only */ }

    toast.success("Agent run completed");
    setRunning(false);
    window.setTimeout(() => setActiveIndex(undefined), 1500);
  };

  const addStepAt = (index: number) => {
    if (!agent) return;
    const steps = [...(agent.spec.steps ?? [])];
    steps.splice(index, 0, {
      title: "New step",
      integration: INTEGRATIONS[steps.length % INTEGRATIONS.length],
      action: "Configure this step",
    });
    persistSpec({ ...agent.spec, steps });
    setEditing({ kind: "step", index });
  };

  const removeStep = (index: number) => {
    if (!agent) return;
    const steps = (agent.spec.steps ?? []).filter((_, i) => i !== index);
    persistSpec({ ...agent.spec, steps });
    setEditing(null);
  };

  const updateStep = (index: number, patch: Partial<AgentStep>) => {
    if (!agent) return;
    const steps = (agent.spec.steps ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s));
    persistSpec({ ...agent.spec, steps });
  };

  const updateTrigger = (patch: Partial<AgentTrigger>) => {
    if (!agent) return;
    persistSpec({ ...agent.spec, trigger: { ...agent.spec.trigger, ...patch } });
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link to="/app/agents" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Agents
        </Link>
        <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/60 p-10 text-center">
          <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h1 className="mt-3 text-lg font-semibold">Agent unavailable</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loadError ?? "This agent couldn't be loaded."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-6 py-8">
      <Link to="/app/agents" className="mb-4 inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Agents
      </Link>
      <PageHeader
        title={agent.name}
        subtitle={agent.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {saving && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving</span>}
            <button
              onClick={handleRun}
              disabled={running}
              className="clicky flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
            </button>
          </div>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <WorkflowCanvas
          agent={agent}
          activeIndex={activeIndex}
          editing={editing}
          onSelectTrigger={() => setEditing({ kind: "trigger" })}
          onSelectStep={(i) => setEditing({ kind: "step", index: i })}
          onAddStep={(i) => addStepAt(i)}
          onRemoveStep={(i) => removeStep(i)}
          onMoveNode={(kind, index, x, y) => {
            if (!agent) return;
            if (kind === "trigger") {
              persistSpec({ ...agent.spec, trigger: { ...agent.spec.trigger, x, y } });
            } else {
              const steps = (agent.spec.steps ?? []).map((s, i) => (i === index ? { ...s, x, y } : s));
              persistSpec({ ...agent.spec, steps });
            }
          }}
        />

        {/* Right panel */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-black/5 bg-white">
          {editing ? (
            <EditPanel
              key={editing.kind === "trigger" ? "trigger" : `step-${editing.index}`}
              agent={agent}
              editing={editing}
              onClose={() => setEditing(null)}
              onUpdateTrigger={updateTrigger}
              onUpdateStep={(patch) => editing.kind === "step" && updateStep(editing.index, patch)}
              onDelete={() => editing.kind === "step" && removeStep(editing.index)}
            />
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-black/5 p-2">
                <div className="flex rounded-lg bg-black/[0.04] p-0.5">
                  <TabBtn active={tab === "logs"} onClick={() => setTab("logs")} icon={ListTree}>
                    Logs
                  </TabBtn>
                  <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare}>
                    Edit via chat
                  </TabBtn>
                </div>
              </div>
              {tab === "logs" ? (
                <LogsPanel runs={runs} />
              ) : (
                <ChatEditor
                  agent={agent}
                  onSpecChange={(next, summary) => {
                    persistSpec(next);
                    if (summary) toast.success(summary);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function statusFor(i: number, activeIndex: number | undefined): "idle" | "pending" | "active" | "done" {
  if (activeIndex === undefined) return "idle";
  if (activeIndex === -1) return "done";
  if (i < activeIndex) return "done";
  if (i === activeIndex) return "active";
  return "pending";
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`clicky-sm flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

// ---------- Workflow canvas (drag & drop, n8n-style) ----------

const NODE_W = 220;
const NODE_H = 88;

function defaultPosition(index: number): { x: number; y: number } {
  // Lay nodes out in a horizontal flow with gentle vertical staggering
  const col = index;
  const x = 80 + col * (NODE_W + 80);
  const y = 120 + (index % 2 === 0 ? 0 : 32);
  return { x, y };
}

type CanvasNodeMeta =
  | { kind: "trigger"; x: number; y: number; index: 0 }
  | { kind: "step"; x: number; y: number; index: number };

function WorkflowCanvas({
  agent,
  activeIndex,
  editing,
  onSelectTrigger,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onMoveNode,
}: {
  agent: Agent;
  activeIndex: number | undefined;
  editing: { kind: "trigger" } | { kind: "step"; index: number } | null;
  onSelectTrigger: () => void;
  onSelectStep: (i: number) => void;
  onAddStep: (i: number) => void;
  onRemoveStep: (i: number) => void;
  onMoveNode: (kind: "trigger" | "step", index: number, x: number, y: number) => void;
}) {
  const trig = agent.spec.trigger ?? { type: "manual", description: "Run on demand" };
  const steps = agent.spec.steps ?? [];

  // Local positions for smooth dragging (committed to spec on drop)
  const initial = useMemo<CanvasNodeMeta[]>(() => {
    const out: CanvasNodeMeta[] = [];
    const tp = trig.x !== undefined && trig.y !== undefined ? { x: trig.x, y: trig.y } : defaultPosition(0);
    out.push({ kind: "trigger", index: 0, ...tp });
    steps.forEach((s, i) => {
      const p = s.x !== undefined && s.y !== undefined ? { x: s.x, y: s.y } : defaultPosition(i + 1);
      out.push({ kind: "step", index: i, ...p });
    });
    return out;
  }, [agent]);

  const [positions, setPositions] = useState<CanvasNodeMeta[]>(initial);
  useEffect(() => setPositions(initial), [initial]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ idx: number; ox: number; oy: number; px: number; py: number } | null>(null);
  const panRef = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);

  const onNodePointerDown = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = positions[idx];
    dragRef.current = { idx, ox: p.x, oy: p.y, px: e.clientX, py: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = (e.clientX - d.px) / zoom;
      const dy = (e.clientY - d.py) / zoom;
      setPositions((cur) => cur.map((n, i) => (i === d.idx ? { ...n, x: d.ox + dx, y: d.oy + dy } : n)));
    } else if (panRef.current) {
      const p = panRef.current;
      setPan({ x: p.ox + (e.clientX - p.px), y: p.oy + (e.clientY - p.py) });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const d = dragRef.current;
      const final = positions[d.idx];
      if (Math.abs(final.x - d.ox) > 1 || Math.abs(final.y - d.oy) > 1) {
        onMoveNode(final.kind, final.kind === "trigger" ? 0 : final.index, Math.round(final.x), Math.round(final.y));
      }
      dragRef.current = null;
    }
    panRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    panRef.current = { ox: pan.x, oy: pan.y, px: e.clientX, py: e.clientY };
  };

  const fitView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Edges: trigger → step 0 → step 1 → … → step n-1
  const edges = positions.slice(0, -1).map((from, i) => ({ from, to: positions[i + 1], id: i }));

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <GitBranch className="h-3 w-3" /> Workflow editor
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="clicky-sm rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >−</button>
          <div className="w-10 text-center text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</div>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
            className="clicky-sm rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >+</button>
          <button
            onClick={fitView}
            className="clicky-sm ml-1 flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            title="Reset view"
          >
            <Maximize2 className="h-3 w-3" /> Fit
          </button>
          <button
            onClick={() => onAddStep(steps.length)}
            className="clicky-sm ml-2 flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Step
          </button>
        </div>
      </div>

      <div
        ref={wrapperRef}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden rounded-2xl border border-black/5 bg-[oklch(0.985_0.005_85)] active:cursor-grabbing"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.82 0.015 85) 1px, transparent 0)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* SVG edges */}
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width="1"
            height="1"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.72 0.05 60)" />
              </marker>
            </defs>
            {edges.map((e) => {
              const x1 = e.from.x + NODE_W;
              const y1 = e.from.y + NODE_H / 2;
              const x2 = e.to.x;
              const y2 = e.to.y + NODE_H / 2;
              const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
              const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
              const isActive =
                activeIndex !== undefined &&
                activeIndex !== -1 &&
                e.id < activeIndex;
              return (
                <g key={e.id}>
                  <path d={path} fill="none" stroke="oklch(0.85 0.02 70)" strokeWidth={2} />
                  {isActive && (
                    <path d={path} fill="none" stroke="oklch(0.72 0.21 45)" strokeWidth={2.5} markerEnd="url(#arrow)" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {positions.map((n, idx) => {
            const isTrigger = n.kind === "trigger";
            const data = isTrigger ? trig : steps[n.index];
            if (!data) return null;
            const status = statusFor(idx, activeIndex);
            const selected =
              editing?.kind === (isTrigger ? "trigger" : "step") &&
              (isTrigger || (editing.kind === "step" && editing.index === n.index));
            const Icon = isTrigger ? triggerIcon((data as AgentTrigger).type) : Bot;
            return (
              <FlowNode
                key={`${n.kind}-${n.index}`}
                x={n.x}
                y={n.y}
                width={NODE_W}
                height={NODE_H}
                kind={n.kind}
                index={isTrigger ? 0 : n.index + 1}
                title={isTrigger ? (data as AgentTrigger).type : (data as AgentStep).title}
                sub={isTrigger ? (data as AgentTrigger).description : `${(data as AgentStep).integration} · ${(data as AgentStep).action}`}
                Icon={Icon}
                status={status}
                selected={selected}
                onPointerDown={(e) => onNodePointerDown(e, idx)}
                onClick={() => (isTrigger ? onSelectTrigger() : onSelectStep(n.index))}
                onDelete={isTrigger ? undefined : () => onRemoveStep(n.index)}
              />
            );
          })}
        </div>

        {/* Empty hint */}
        {steps.length === 0 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
            Drag nodes to rearrange · click "+ Step" to add
          </div>
        )}
      </div>
    </div>
  );
}

function FlowNode({
  x, y, width, height, kind, index, title, sub, Icon, status, selected,
  onPointerDown, onClick, onDelete,
}: {
  x: number; y: number; width: number; height: number;
  kind: "trigger" | "step";
  index: number;
  title: string;
  sub: string;
  Icon: typeof Bot;
  status: "idle" | "pending" | "active" | "done";
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const ring =
    selected ? "ring-2 ring-primary"
    : status === "active" ? "ring-2 ring-[oklch(0.72_0.21_45)]"
    : status === "done" ? "ring-1 ring-[oklch(0.72_0.21_45)]/40"
    : "ring-1 ring-black/[0.08]";
  return (
    <div
      data-node
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={`group/node absolute cursor-grab select-none rounded-xl bg-white p-3 transition-shadow hover:shadow-md active:cursor-grabbing ${ring}`}
      style={{ left: x, top: y, width, height }}
    >
      {/* connection ports */}
      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[oklch(0.78_0.04_70)]" />
      <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[oklch(0.78_0.04_70)]" />

      <div className="flex items-center gap-2.5">
        <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          status === "done" || status === "active"
            ? "bg-[oklch(0.72_0.21_45)] text-white"
            : kind === "trigger"
              ? "bg-[oklch(0.96_0.02_60)] text-[oklch(0.4_0_0)]"
              : "bg-[oklch(0.97_0_0)] text-[oklch(0.4_0_0)]"
        }`}>
          {status === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "done" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kind === "trigger" ? "Trigger" : `Step ${index}`}
            {status === "active" && <Sparkles className="h-2.5 w-2.5 animate-pulse text-[oklch(0.72_0.21_45)]" />}
          </div>
          <div className="truncate text-sm font-semibold capitalize text-foreground">{title}</div>
        </div>
        {onDelete && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="clicky-sm rounded-md p-1 text-muted-foreground opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover/node:opacity-100"
            title="Delete step"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="mt-1 line-clamp-2 pl-[46px] text-[11px] leading-snug text-muted-foreground">{sub}</div>
    </div>
  );
}

function EditPanel({
  agent,
  editing,
  onClose,
  onUpdateTrigger,
  onUpdateStep,
  onDelete,
}: {
  agent: Agent;
  editing: { kind: "trigger" } | { kind: "step"; index: number };
  onClose: () => void;
  onUpdateTrigger: (patch: Partial<AgentTrigger>) => void;
  onUpdateStep: (patch: Partial<AgentStep>) => void;
  onDelete: () => void;
}) {
  if (editing.kind === "trigger") {
    const trig = agent.spec.trigger ?? { type: "manual", description: "" };
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-black/5 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit trigger</div>
          <button onClick={onClose} className="clicky-sm rounded-md p-1 text-muted-foreground hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field label="Trigger type">
            <select
              value={trig.type}
              onChange={(e) => onUpdateTrigger({ type: e.target.value })}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              value={trig.description}
              onChange={(e) => onUpdateTrigger({ description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            <Save className="h-3 w-3" /> Changes save automatically
          </div>
        </div>
      </div>
    );
  }
  const step = agent.spec.steps?.[editing.index];
  if (!step) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/5 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit step {editing.index + 1}</div>
        <button onClick={onClose} className="clicky-sm rounded-md p-1 text-muted-foreground hover:bg-black/5"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Title">
          <input
            value={step.title}
            onChange={(e) => onUpdateStep({ title: e.target.value })}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Integration">
          <select
            value={step.integration}
            onChange={(e) => onUpdateStep({ integration: e.target.value })}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {INTEGRATIONS.includes(step.integration) ? null : <option value={step.integration}>{step.integration}</option>}
            {INTEGRATIONS.map((i) => (<option key={i} value={i}>{i}</option>))}
          </select>
        </Field>
        <Field label="Action">
          <textarea
            value={step.action}
            onChange={(e) => onUpdateStep({ action: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <button
          onClick={onDelete}
          className="clicky-sm flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete step
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function LogsPanel({ runs }: { runs: Run[] }) {
  const [openId, setOpenId] = useState<string | null>(runs[0]?.id ?? null);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {runs.length === 0 ? (
        <div className="m-3 rounded-xl border border-dashed border-black/[0.08] bg-white/40 p-6 text-center text-xs text-muted-foreground">
          No runs yet — hit Run to try it.
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05]">
          {runs.map((r, idx) => {
            const open = openId === r.id;
            const lines = r.log.split("\n").map((l) => l.trim()).filter(Boolean);
            const summary = lines[0]?.startsWith("•") ? "Run completed" : (lines[0] ?? "Run");
            const body = lines.filter((l) => l !== summary);
            const isLive = idx === 0;
            return (
              <div key={r.id}>
                <button
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-black/[0.02]"
                >
                  {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <CircleDot className={`h-2.5 w-2.5 shrink-0 ${isLive ? "animate-pulse text-[oklch(0.72_0.21_45)]" : "text-emerald-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-foreground">{summary}</div>
                  </div>
                  <div className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </button>
                {open && (
                  <div className="bg-[oklch(0.16_0.01_60)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[oklch(0.92_0.02_85)]">
                    {body.map((b, i) => {
                      const isSub = b.startsWith("↳") || /^\s*↳/.test(b);
                      const time = b.match(/\[([^\]]+)\]/)?.[1];
                      const text = b.replace(/^•\s*/, "").replace(/^\[[^\]]+\]\s*/, "");
                      return (
                        <div key={i} className={`flex gap-2 ${isSub ? "pl-5 text-[oklch(0.7_0.05_85)]" : ""}`}>
                          {time && <span className="shrink-0 text-[oklch(0.55_0.05_85)]">{time}</span>}
                          <span className="break-all">{text || b}</span>
                        </div>
                      );
                    })}
                    {body.length === 0 && <div className="text-[oklch(0.6_0.05_85)]">No detail.</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ChatMsg = { role: "user" | "assistant"; text: string };

function ChatEditor({ agent, onSpecChange }: { agent: Agent; onSpecChange: (next: AgentSpec, summary?: string) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: `Hi! I can edit "${agent.name}" for you. Try things like "add a Slack notification step", "remove step 2", "rename step 1 to Triage", or "change trigger to schedule daily".`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setThinking(true);

    await new Promise((r) => setTimeout(r, 450));

    const result = applyChatCommand(agent.spec, text);
    setMessages((m) => [...m, { role: "assistant", text: result.reply }]);
    setThinking(false);
    if (result.next) onSpecChange(result.next, result.toast);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed animate-[fadeInUp_140ms_ease-out] ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-black/5 bg-[oklch(0.98_0_0)] text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-[oklch(0.98_0_0)] px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Editing…
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-black/5 p-2">
        <div className="flex items-end gap-1.5 rounded-xl border border-black/10 bg-white p-1.5 focus-within:border-primary/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Tell me how to change this agent…"
            rows={1}
            className="max-h-32 min-h-[28px] w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="clicky-sm flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            title="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function applyChatCommand(spec: AgentSpec, text: string): { reply: string; next?: AgentSpec; toast?: string } {
  const t = text.toLowerCase();
  const steps = [...(spec.steps ?? [])];

  // change trigger
  const trigMatch = t.match(/(?:change|set|make)\s+(?:the\s+)?trigger\s+(?:to\s+)?(schedule|webhook|manual|event)(.*)/);
  if (trigMatch) {
    const type = trigMatch[1];
    const desc = trigMatch[2]?.trim().replace(/^[,:]\s*/, "") || (type === "schedule" ? "Runs on a schedule" : type === "webhook" ? "Triggered by an incoming webhook" : type === "event" ? "Reacts to events" : "Run on demand");
    return {
      reply: `Trigger updated to "${type}".`,
      next: { ...spec, trigger: { type, description: desc } },
      toast: "Trigger updated",
    };
  }

  // remove step
  const remMatch = t.match(/(?:remove|delete|drop)\s+step\s+(\d+)/);
  if (remMatch) {
    const i = Number(remMatch[1]) - 1;
    if (i < 0 || i >= steps.length) return { reply: `There's no step ${i + 1}. The agent has ${steps.length} step${steps.length === 1 ? "" : "s"}.` };
    const removed = steps[i];
    steps.splice(i, 1);
    return { reply: `Removed step ${i + 1} ("${removed.title}").`, next: { ...spec, steps }, toast: "Step removed" };
  }

  // rename step
  const renMatch = t.match(/rename\s+step\s+(\d+)\s+to\s+(.+)/);
  if (renMatch) {
    const i = Number(renMatch[1]) - 1;
    const name = renMatch[2].trim().replace(/[."']+$/g, "");
    if (i < 0 || i >= steps.length) return { reply: `There's no step ${i + 1}.` };
    steps[i] = { ...steps[i], title: name };
    return { reply: `Renamed step ${i + 1} to "${name}".`, next: { ...spec, steps }, toast: "Step renamed" };
  }

  // add step
  if (/\b(add|create|insert|append)\b.*\bstep\b/.test(t) || /\badd\b/.test(t)) {
    const integration =
      INTEGRATIONS.find((i) => t.includes(i.toLowerCase())) ?? INTEGRATIONS[steps.length % INTEGRATIONS.length];
    let title = "New step";
    const titleMatch = text.match(/(?:called|named|titled)\s+["']?([^"']{2,40})["']?/i);
    if (titleMatch) title = titleMatch[1].trim();
    else if (/notif/.test(t)) title = `${integration} notification`;
    else if (/summar/.test(t)) title = `Summarize with ${integration}`;
    else if (/post|send/.test(t)) title = `Post to ${integration}`;
    else if (/fetch|pull|read|sync/.test(t)) title = `Sync from ${integration}`;
    const action =
      /notif|post|send/.test(t)
        ? `Send a message via ${integration}`
        : /summar/.test(t)
          ? `Summarize the latest payload`
          : /fetch|pull|read|sync/.test(t)
            ? `Pull recent records from ${integration}`
            : `Run ${integration} action`;
    steps.push({ title, integration, action });
    return {
      reply: `Added step ${steps.length}: "${title}" (${integration}).`,
      next: { ...spec, steps },
      toast: "Step added",
    };
  }

  return {
    reply:
      "Try one of: \"add a Slack notification step\", \"remove step 2\", \"rename step 1 to Triage\", or \"change trigger to schedule daily\".",
  };
}

function buildMockRuns(agent: Agent): Run[] {
  const steps = agent.spec.steps ?? [];
  const trig = agent.spec.trigger?.description ?? "Triggered";
  const now = Date.now();
  const samples = [
    { summary: `${trig} — completed in 1.4s`, detail: (s: AgentStep) => `${s.integration}: ${s.action} → ok` },
    { summary: `Scheduled run · processed 12 items`, detail: (s: AgentStep) => `${s.title} via ${s.integration} (${s.action})` },
    { summary: `Manual run by you — 8 records updated`, detail: (s: AgentStep) => `${s.integration} • ${s.action} • 200 OK` },
  ];
  return samples.map((sample, i) => {
    const lines = steps.length ? steps.map((s) => `• ${sample.detail(s)}`) : ["• Trigger received", "• Processed payload", "• Wrote results"];
    return {
      id: `mock-${i}`,
      created_at: new Date(now - (i + 1) * 1000 * 60 * 47).toISOString(),
      log: `${sample.summary}\n\n${lines.join("\n")}`,
    };
  });
}

// Normalize agent specs created from the chat brain (different shape) into the
// shape this page expects: { trigger:{type,description}, steps:[...] }
type ChatBrainSpec = {
  name?: string;
  description?: string;
  emoji?: string;
  schedule?: { cadence?: string; timeOfDay?: string };
  trigger?: unknown;
  action?: string;
  dataSources?: string[];
  channel?: string;
  recipient?: string;
  tools?: string[];
};

function normalizeAgent(a: Agent): Agent {
  const raw = (a.spec ?? {}) as unknown as ChatBrainSpec & Partial<AgentSpec>;
  const trig = raw.trigger;
  const hasObjectTrigger =
    trig && typeof trig === "object" && "type" in (trig as object) && "description" in (trig as object);
  const hasArraySteps = Array.isArray((raw as Partial<AgentSpec>).steps);

  if (hasObjectTrigger && hasArraySteps) return a;

  // Derive trigger
  let trigger: AgentTrigger;
  if (hasObjectTrigger) {
    trigger = trig as AgentTrigger;
  } else if (raw.schedule?.cadence) {
    const cadence = raw.schedule.cadence;
    const time = raw.schedule.timeOfDay ?? "09:00";
    const desc =
      typeof trig === "string" && trig
        ? trig
        : `${cadence === "weekdays" ? "Weekdays" : cadence.charAt(0).toUpperCase() + cadence.slice(1)} at ${time}`;
    trigger = { type: "schedule", description: desc };
  } else if (typeof trig === "string" && trig) {
    trigger = { type: "manual", description: trig };
  } else {
    trigger = { type: "manual", description: "Run on demand" };
  }

  // Derive steps from dataSources + tools + action
  const steps: AgentStep[] = [];
  for (const src of raw.dataSources ?? []) {
    const integration = src.split(/[ (]/)[0] || "Source";
    steps.push({ title: `Read from ${integration}`, integration, action: src });
  }
  for (const tool of raw.tools ?? []) {
    if ((raw.dataSources ?? []).some((d) => d.startsWith(tool))) continue;
    steps.push({ title: `Use ${tool}`, integration: tool, action: `Call ${tool} API` });
  }
  if (raw.action) {
    const channel = raw.channel ?? "in-app";
    const integration =
      channel === "sms" ? "Twilio" : channel === "email" ? "Gmail" : channel === "slack" ? "Slack" : "Beevr";
    steps.push({
      title: `Send via ${integration}`,
      integration,
      action: raw.recipient ? `${raw.action} → ${raw.recipient}` : raw.action,
    });
  }
  if (steps.length === 0) {
    steps.push({ title: "Run", integration: "Beevr", action: "Execute agent" });
  }

  return { ...a, spec: { ...(a.spec as object), trigger, steps } as AgentSpec };
}
