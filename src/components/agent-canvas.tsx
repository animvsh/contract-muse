import { Bot, Calendar, Webhook, Zap, MousePointerClick, Loader2, Check, Sparkles } from "lucide-react";

export type AgentStep = { title: string; integration: string; action: string };
export type AgentTrigger = { type: string; description: string };

const triggerIcon = (type: string) => {
  if (type === "schedule") return Calendar;
  if (type === "webhook") return Webhook;
  if (type === "event") return Zap;
  return MousePointerClick;
};

export function AgentCanvas({
  trigger,
  steps,
  activeIndex,
}: {
  trigger: AgentTrigger;
  steps: AgentStep[];
  activeIndex?: number; // -1 done, 0..n active, undefined idle
}) {
  const TIcon = triggerIcon(trigger.type);
  const all = [
    { kind: "trigger" as const, title: trigger.type, sub: trigger.description, Icon: TIcon },
    ...steps.map((s) => ({ kind: "step" as const, title: s.title, sub: `${s.integration} · ${s.action}`, Icon: Bot })),
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm backdrop-blur">
      {activeIndex !== undefined && activeIndex !== -1 && (
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[60%] -translate-x-1/2 rounded-full bg-[oklch(0.72_0.21_45)]/20 blur-3xl" />
      )}

      <div className="relative overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-0">
          {all.map((node, i) => {
            const status =
              activeIndex === undefined
                ? "idle"
                : activeIndex === -1 || i < activeIndex
                  ? "done"
                  : i === activeIndex
                    ? "active"
                    : "pending";
            return (
              <div key={i} className="flex items-stretch">
                <Node title={node.title} sub={node.sub} Icon={node.Icon} kind={node.kind} status={status} index={i} />
                {i < all.length - 1 && <Connector status={status} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Connector({ status }: { status: "idle" | "pending" | "active" | "done" }) {
  const filled = status === "done" || status === "active";
  return (
    <div className="relative flex w-12 items-center self-center">
      <div className="h-[2px] w-full rounded-full bg-black/[0.06]" />
      <div
        className={`absolute inset-y-0 left-0 my-auto h-[2px] rounded-full transition-all duration-700 ease-out ${
          filled ? "w-full bg-[oklch(0.72_0.21_45)]" : "w-0"
        }`}
      />
      {status === "active" && (
        <span className="absolute inset-y-0 right-0 my-auto h-2 w-2 -translate-y-px animate-pulse rounded-full bg-[oklch(0.72_0.21_45)] shadow-[0_0_12px_2px_oklch(0.72_0.21_45)]" />
      )}
    </div>
  );
}

function Node({
  title,
  sub,
  Icon,
  kind,
  status,
  index,
}: {
  title: string;
  sub: string;
  Icon: typeof Bot;
  kind: "trigger" | "step";
  status: "idle" | "pending" | "active" | "done";
  index: number;
}) {
  const ring =
    status === "active"
      ? "ring-2 ring-[oklch(0.72_0.21_45)] shadow-xl shadow-[oklch(0.72_0.21_45)]/25 -translate-y-0.5"
      : status === "done"
        ? "ring-1 ring-[oklch(0.72_0.21_45)]/40"
        : status === "pending"
          ? "ring-1 ring-black/[0.06] opacity-60"
          : "ring-1 ring-black/[0.06]";

  return (
    <div
      className={`group relative w-56 shrink-0 rounded-xl bg-white p-3.5 transition-all duration-500 alive ${ring} ${status === "active" ? "glow-pulse" : ""}`}
      style={{ animation: `fade-in 0.4s ease-out ${index * 60}ms both` }}
    >
      {status === "active" && (
        <span className="pointer-events-none absolute -inset-px rounded-xl bg-[oklch(0.72_0.21_45)]/20 opacity-50 blur-md" />
      )}

      <div className="relative flex items-center gap-2">
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            status === "done"
              ? "bg-[oklch(0.72_0.21_45)] text-white"
              : status === "active"
                ? "bg-[oklch(0.72_0.21_45)] text-white"
                : kind === "trigger"
                  ? "bg-[oklch(0.96_0.02_60)] text-[oklch(0.4_0_0)]"
                  : "bg-[oklch(0.97_0_0)] text-[oklch(0.4_0_0)]"
          }`}
        >
          {status === "active" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "done" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {status === "active" && (
            <span className="absolute inset-0 animate-ping rounded-lg bg-[oklch(0.72_0.21_45)]/30" />
          )}
        </span>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kind === "trigger" ? "Trigger" : `Step ${index}`}
          </div>
          {status === "active" && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-[oklch(0.55_0.2_40)]">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" /> running
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-sm font-semibold capitalize leading-tight text-foreground">{title}</div>
      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
