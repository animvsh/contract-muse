import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
  Copy,
  X,
  Lock,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import {
  createAccessKey,
  listAccessKeys,
  updateAccessKeyStatus,
} from "@/lib/access-keys.functions";
import {
  CLIENTS,
  PERMISSIONS,
  SAFETY,
  SCOPES,
  clientLabel,
  permissionLabel,
  permissionMeta,
  scopeLabel,
} from "@/lib/access-keys-config";

export const Route = createFileRoute("/app/keys")({
  component: KeysPage,
});

type AccessKey = Awaited<ReturnType<typeof listAccessKeys>>[number];

function KeysPage() {
  const { user } = useAuth();
  const list = useServerFn(listAccessKeys);
  const setStatus = useServerFn(updateAccessKeyStatus);
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["access-keys", user?.id],
    queryFn: () => list(),
    enabled: !!user,
    retry: false,
  });
  const keys: AccessKey[] = Array.isArray(data) ? data : [];
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<AccessKey | null>(null);

  const toggle = useMutation({
    mutationFn: (k: AccessKey) =>
      setStatus({ data: { id: k.id, status: k.status === "active" ? "paused" : "active" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-keys"] }),
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <PageHeader
        title="Access Keys"
        subtitle="Connect coding agents, CLIs, and builders to this workspace safely."
        action={
          <button
            onClick={() => setOpen(true)}
            className="clicky flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" /> Create access key
          </button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Couldn't load access keys. {error instanceof Error ? error.message : ""} Try refreshing.
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center text-sm text-muted-foreground">
          Loading access keys…
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">No access keys yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a key to give OpenCode, Claude Code, Cursor, or any CLI safe
            access to your workspace.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="clicky mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" /> Create your first key
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {keys.map((k) => (
            <KeyCard key={k.id} k={k} onToggle={() => toggle.mutate(k)} />
          ))}
        </div>
      )}

      {open && (
        <CreateKeyModal
          onClose={() => setOpen(false)}
          onCreated={(k) => {
            setOpen(false);
            setCreated(k);
            qc.invalidateQueries({ queryKey: ["access-keys"] });
          }}
        />
      )}
      {created && <KeyCreatedModal k={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

function KeyCard({ k, onToggle }: { k: AccessKey; onToggle: () => void }) {
  const meta = permissionMeta(k.permission);
  return (
    <Link
      to="/app/keys/$id"
      params={{ id: k.id }}
      className="clicky group block rounded-2xl border border-border bg-white/70 p-4 backdrop-blur hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{k.name}</h3>
            <StatusPill status={k.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Used by <span className="font-medium text-foreground">{clientLabel(k.client)}</span></span>
            <span>·</span>
            <span>Scope: {k.scope_label || scopeLabel(k.scope)}</span>
            <span>·</span>
            <span>{meta.label}</span>
            {k.expires_at && (
              <>
                <span>·</span>
                <span>Expires {new Date(k.expires_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            {k.key_prefix}••••••••
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            className="clicky-sm rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={k.status === "active" ? "Pause" : "Resume"}
          >
            {k.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-500/15 text-green-700",
    paused: "bg-yellow-500/15 text-yellow-700",
    revoked: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ---------------- Create wizard ----------------

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (k: AccessKey) => void;
}) {
  const create = useServerFn(createAccessKey);
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<(typeof CLIENTS)[number]["id"]>("opencode");
  const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("workspace");
  const [scopeLbl, setScopeLbl] = useState("");
  const [permission, setPermission] = useState<(typeof PERMISSIONS)[number]["id"]>("sandbox");
  const [safety, setSafety] = useState<(typeof SAFETY)[number]["id"]>("balanced");
  const [name, setName] = useState("");
  const [expiresEnabled, setExpiresEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const defaultName = `${clientLabel(client)} ${scope === "team" && scopeLbl ? scopeLbl + " " : ""}Key`;
  const finalName = name.trim() || defaultName;

  const submit = async () => {
    setSubmitting(true);
    try {
      const k = await create({
        data: {
          name: finalName,
          client,
          scope,
          scopeLabel: scopeLbl || undefined,
          permission,
          safety,
          expiresInDays: expiresEnabled ? 30 : undefined,
        },
      });
      onCreated(k);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create key");
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Create access key">
      <Stepper step={step} total={5} labels={["Client", "Access", "Permissions", "Safety", "Review"]} />

      {step === 1 && (
        <Section title="What will use this access key?">
          <div className="grid gap-2">
            {CLIENTS.map((c) => (
              <OptionCard
                key={c.id}
                selected={client === c.id}
                onClick={() => setClient(c.id)}
                title={c.label}
                desc={c.desc}
              />
            ))}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="What workspace knowledge can it use?">
          <div className="grid gap-2">
            {SCOPES.map((s) => (
              <OptionCard
                key={s.id}
                selected={scope === s.id}
                onClick={() => setScope(s.id)}
                title={s.label}
                desc=""
              />
            ))}
          </div>
          {(scope === "team" || scope === "collection") && (
            <input
              autoFocus
              value={scopeLbl}
              onChange={(e) => setScopeLbl(e.target.value)}
              placeholder={scope === "team" ? "Team name (e.g. Support)" : "Collection name"}
              className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          )}
        </Section>
      )}

      {step === 3 && (
        <Section title="What should it be allowed to do?">
          <div className="grid gap-2">
            {PERMISSIONS.map((p) => (
              <OptionCard
                key={p.id}
                selected={permission === p.id}
                onClick={() => setPermission(p.id)}
                title={p.label}
                desc={p.desc}
                warning={"warning" in p ? p.warning : false}
              />
            ))}
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section title="How safe should this key be?">
          <div className="grid gap-2">
            {SAFETY.map((s) => (
              <OptionCard
                key={s.id}
                selected={safety === s.id}
                onClick={() => setSafety(s.id)}
                title={s.label}
                desc={s.desc}
              />
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <input
              type="checkbox"
              checked={expiresEnabled}
              onChange={(e) => setExpiresEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Expire this key automatically after <strong>30 days</strong></span>
          </label>
        </Section>
      )}

      {step === 5 && (
        <Section title="Review">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
          <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <Row label="Used by" value={clientLabel(client)} />
            <Row label="Scope" value={scopeLbl ? `${scopeLabel(scope)} · ${scopeLbl}` : scopeLabel(scope)} />
            <Row label="Permission" value={permissionLabel(permission)} />
            <Row label="Safety" value={SAFETY.find((s) => s.id === safety)!.label} />
            <Row label="Expires" value={expiresEnabled ? "30 days" : "Never"} />
          </div>
          <PermissionSummary id={permission} />
        </Section>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <button
          onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
          className="clicky-sm rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 2 && (scope === "team" || scope === "collection") && !scopeLbl.trim()}
            className="clicky flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="clicky flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create key"}
          </button>
        )}
      </div>
    </Modal>
  );
}

function PermissionSummary({ id }: { id: string }) {
  const p = permissionMeta(id);
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-green-700">
          <Check className="h-3.5 w-3.5" /> Can do
        </div>
        <ul className="space-y-1 text-xs text-foreground">
          {p.allowed.map((a) => (
            <li key={a}>· {a}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <Lock className="h-3.5 w-3.5" /> Blocked
        </div>
        <ul className="space-y-1 text-xs text-foreground">
          {p.blocked.map((a) => (
            <li key={a}>· {a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------- Created modal ----------------

function KeyCreatedModal({ k, onClose }: { k: AccessKey; onClose: () => void }) {
  const navigate = useNavigate();
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  const setupBlock = buildSetupBlock(k);

  return (
    <Modal onClose={onClose} title="Your access key is ready" wide>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-800">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>
            Use this key to connect <strong>{clientLabel(k.client)}</strong> to this workspace. The full key is shown <strong>only once</strong>.
          </span>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            API Key
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3 font-mono text-sm">
            <code className="flex-1 truncate">{k.key_plaintext}</code>
            <button
              onClick={() => copy(k.key_plaintext ?? "", "API key")}
              className="clicky-sm flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Setup for {clientLabel(k.client)}
          </div>
          <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
            {setupBlock}
          </pre>
          <button
            onClick={() => copy(setupBlock, "Setup")}
            className="clicky-sm mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Copy className="h-3 w-3" /> Copy setup
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button onClick={onClose} className="clicky-sm rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            Done
          </button>
          <button
            onClick={() => navigate({ to: "/app/keys/$id", params: { id: k.id } })}
            className="clicky rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            View details
          </button>
        </div>
      </div>
    </Modal>
  );
}

function buildSetupBlock(k: AccessKey): string {
  const meta = permissionMeta(k.permission);
  const allowed = meta.allowed.map((a) => `  - ${a}`).join("\n");
  const blocked = meta.blocked.map((a) => `  - ${a}`).join("\n");
  return `# Beevr Workspace Access
BEEVR_API_KEY=${k.key_plaintext}
BEEVR_WORKSPACE=${k.scope_label || scopeLabel(k.scope)}

# Allowed
${allowed}

# Blocked
${blocked}

# Prompt for ${clientLabel(k.client)}
You are connected to a Beevr workspace via the access key above.
Use Beevr to read approved knowledge, build tools in sandbox, run tests,
and submit completed work for review. Do NOT send external messages,
delete data, install tools, or activate agents unless Beevr explicitly
indicates approval has been granted.`;
}

// ---------------- shared bits ----------------

function Modal({
  children,
  onClose,
  title,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-xl"} animate-pop rounded-2xl border border-border bg-card p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="clicky-sm rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stepper({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div className="mb-5 flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center gap-1">
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? "bg-primary" : "bg-border"
            }`}
          />
        </div>
      ))}
      <span className="ml-3 text-xs text-muted-foreground">
        Step {step} of {total} · {labels[step - 1]}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
  warning,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  warning?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`clicky w-full rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
          : "border-border bg-white hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium">
            {title}
            {warning && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
                <AlertTriangle className="h-2.5 w-2.5" /> high trust
              </span>
            )}
          </div>
          {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
        </div>
      </div>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
