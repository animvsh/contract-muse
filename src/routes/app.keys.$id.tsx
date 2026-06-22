import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  KeyRound,
  Copy,
  RotateCw,
  Pause,
  Play,
  Trash2,
  Check,
  Lock,
  Activity,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAccessKey,
  rotateAccessKey,
  updateAccessKeyStatus,
  deleteAccessKey,
} from "@/lib/access-keys.functions";
import {
  clientLabel,
  permissionLabel,
  permissionMeta,
  scopeLabel,
} from "@/lib/access-keys-config";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/keys/$id")({
  component: KeyDetail,
});

function KeyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const get = useServerFn(getAccessKey);
  const rotate = useServerFn(rotateAccessKey);
  const setStatus = useServerFn(updateAccessKeyStatus);
  const del = useServerFn(deleteAccessKey);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["access-key", id, user?.id],
    queryFn: () => get({ data: { id } }),
    enabled: !!user,
    retry: false,
  });

  const rotateMut = useMutation({
    mutationFn: () => rotate({ data: { id } }),
    onSuccess: () => {
      toast.success("Key rotated. New value shown once.");
      qc.invalidateQueries({ queryKey: ["access-key", id] });
      qc.invalidateQueries({ queryKey: ["access-keys"] });
    },
  });
  const toggleMut = useMutation({
    mutationFn: () =>
      setStatus({
        data: { id, status: data?.key?.status === "active" ? "paused" : "active" },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["access-key", id] });
      qc.invalidateQueries({ queryKey: ["access-keys"] });
    },
  });
  const delMut = useMutation({
    mutationFn: () => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Key deleted");
      qc.invalidateQueries({ queryKey: ["access-keys"] });
      navigate({ to: "/app/keys" });
    },
  });

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }
  if (error || !data?.key) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link to="/app/keys" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to keys
        </Link>
        <div className="rounded-2xl border border-border bg-white/70 p-8 text-center">
          <h2 className="text-lg font-semibold">Key not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "This access key may have been deleted."}
          </p>
        </div>
      </div>
    );
  }
  const k = data.key;
  const meta = permissionMeta(k.permission);

  const copyKey = () => {
    if (!k.key_plaintext) return toast.error("Full key no longer visible. Rotate to get a new one.");
    navigator.clipboard.writeText(k.key_plaintext);
    toast.success("API key copied");
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link to="/app/keys" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Access Keys
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{k.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Used by <span className="font-medium text-foreground">{clientLabel(k.client)}</span></span>
            <span>·</span>
            <span>Scope: {k.scope_label || scopeLabel(k.scope)}</span>
            <span>·</span>
            <span>{permissionLabel(k.permission)}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => toggleMut.mutate()} className="clicky-sm flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm hover:bg-muted">
            {k.status === "active" ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
          </button>
          <button onClick={() => rotateMut.mutate()} className="clicky-sm flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm hover:bg-muted">
            <RotateCw className="h-3.5 w-3.5" /> Rotate
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this key? CLIs using it will lose access immediately.")) delMut.mutate();
            }}
            className="clicky-sm flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">API Key</div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3 font-mono text-sm">
          <code className="flex-1 truncate">
            {k.key_plaintext ?? `${k.key_prefix}••••••••••••`}
          </code>
          <button
            onClick={copyKey}
            disabled={!k.key_plaintext}
            className="clicky-sm flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
        {!k.key_plaintext && (
          <div className="mt-2 text-xs text-muted-foreground">
            The full key is no longer visible. Rotate to generate a new one.
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Allowed actions
          </div>
          <ul className="space-y-1 text-sm">
            {meta.allowed.map((a) => <li key={a} className="text-foreground">· {a}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <Lock className="h-4 w-4" /> Blocked actions
          </div>
          <ul className="space-y-1 text-sm">
            {meta.blocked.map((a) => <li key={a} className="text-foreground">· {a}</li>)}
          </ul>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Usage
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Total calls" value={String(k.usage_count)} />
          <Stat label="Last used" value={k.last_used_at ? timeAgo(k.last_used_at) : "Never"} />
          <Stat label="Status" value={k.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="h-4 w-4 text-primary" /> Activity
        </div>
        {data.events.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <ul className="space-y-2">
            {data.events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="flex-1">
                  <div>{e.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-lg font-semibold capitalize">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
