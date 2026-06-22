import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2, X, Sparkles } from "lucide-react";
import { useWorkspaces, type Workspace } from "@/hooks/use-workspaces";
import { toast } from "sonner";

const COLOR_PRESETS = [
  "oklch(0.68 0.22 40)",
  "oklch(0.7 0.16 145)",
  "oklch(0.68 0.18 250)",
  "oklch(0.74 0.16 85)",
  "oklch(0.7 0.18 320)",
  "oklch(0.68 0.18 200)",
];

const INDUSTRIES = [
  "AI Tooling",
  "E-commerce",
  "SaaS",
  "Finance",
  "Healthcare",
  "Media",
  "Education",
  "Consulting",
  "Other",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function WorkspaceSwitcher() {
  const { workspaces, current, switchTo } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="clicky group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-sm"
            style={{ background: current.color }}
          >
            {initials(current.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight text-[oklch(0.18_0_0)]">
              {current.name}
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-[oklch(0.5_0_0)]">
              {current.company}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[oklch(0.55_0_0)] transition-colors group-hover:text-[oklch(0.2_0_0)]" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 origin-top animate-[fadeInUp_140ms_ease-out] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18),0_2px_6px_-2px_rgba(0,0,0,0.08)]">
            <div className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.55_0_0)]">
              Workspaces
            </div>
            <div className="max-h-72 overflow-y-auto px-1 pb-1">
              {workspaces.map((w) => {
                const active = w.id === current.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      switchTo(w.id);
                      setOpen(false);
                      if (!active) toast.success(`Switched to ${w.name}`);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      active ? "bg-[oklch(0.96_0_0)]" : "hover:bg-black/[0.04]"
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-sm"
                      style={{ background: w.color }}
                    >
                      {initials(w.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium leading-tight text-[oklch(0.18_0_0)]">
                        {w.name}
                      </span>
                      <span className="block truncate text-[10.5px] leading-tight text-[oklch(0.5_0_0)]">
                        {w.company}
                      </span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-[oklch(0.55_0.18_145)]" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-black/[0.06] p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="clicky flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[oklch(0.2_0_0)] hover:bg-black/[0.04]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-black/20 bg-white text-[oklch(0.45_0_0)]">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                Create workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {creating && <CreateWorkspaceModal onClose={() => setCreating(false)} />}
    </>
  );
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { createWorkspace } = useWorkspaces();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canNext = step === 1 ? name.trim().length > 0 && company.trim().length > 0 : true;

  const finish = () => {
    const ws = createWorkspace({
      name: name.trim(),
      company: company.trim(),
      industry,
      color,
    });
    toast.success(`Workspace "${ws.name}" created`, {
      description: "It's a separate entity with its own data.",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-[fadeInUp_140ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[oklch(0.45_0_0)] hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-black/5 px-6 pb-4 pt-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)]">
            <Sparkles className="h-3.5 w-3.5" /> New workspace · Step {step} of 2
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[oklch(0.15_0_0)]">
            {step === 1 ? "Set up your new entity" : "Pick a look"}
          </h2>
          <p className="mt-1 text-sm text-[oklch(0.45_0_0)]">
            {step === 1
              ? "Each workspace is fully isolated — separate agents, data, billing, and people."
              : "A color and identity so you can tell your workspaces apart at a glance."}
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {step === 1 ? (
            <>
              <Field label="Workspace name">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme HQ"
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[oklch(0.68_0.22_40)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,oklch(0.68_0.22_40)_18%,transparent)]"
                />
              </Field>
              <Field label="Company / entity">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[oklch(0.68_0.22_40)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,oklch(0.68_0.22_40)_18%,transparent)]"
                />
              </Field>
              <Field label="Industry">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[oklch(0.68_0.22_40)]"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-[oklch(0.97_0.02_85)] p-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold text-white shadow-md"
                  style={{ background: color }}
                >
                  {initials(name || "W")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[oklch(0.2_0_0)]">
                    {name || "Workspace"}
                  </div>
                  <div className="truncate text-xs text-[oklch(0.5_0_0)]">
                    {company || "Company"} · {industry}
                  </div>
                </div>
              </div>
              <Field label="Color">
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-9 w-9 rounded-lg shadow-sm transition-all ${
                        color === c
                          ? "ring-2 ring-offset-2 ring-[oklch(0.3_0_0)]"
                          : "hover:scale-105"
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </Field>
              <div className="rounded-lg border border-[oklch(0.68_0.22_40)]/20 bg-[oklch(0.68_0.22_40)]/5 p-3 text-xs text-[oklch(0.4_0.05_40)]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Building2 className="h-3.5 w-3.5" /> Fully isolated
                </div>
                <p className="mt-1 leading-relaxed">
                  Agents, builds, connections, access keys, team, and billing in this workspace stay
                  completely separate from your other workspaces.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-black/5 bg-[oklch(0.98_0.01_85)] px-6 py-3">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="clicky clicky-sm rounded-lg px-3 py-1.5 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-black/5"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            disabled={!canNext}
            onClick={step === 1 ? () => setStep(2) : finish}
            className="clicky clicky-sm rounded-lg bg-[oklch(0.68_0.22_40)] px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-[oklch(0.68_0.22_40)]/30 transition-all hover:bg-[oklch(0.62_0.22_40)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === 1 ? "Continue" : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CurrentWorkspaceBadge() {
  const { current } = useWorkspaces();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[oklch(0.3_0_0)] shadow-sm"
      title={`${current.company} · ${current.industry}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: current.color }} />
      {current.name}
    </span>
  );
}
