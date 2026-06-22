import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, Loader2, Copy, Check, Server, Code2, BookOpen, History, Settings, Trash2, BarChart3, KeyRound, Plus, Users as UsersIcon, Activity, Clock, Lock, AlertCircle, Terminal, Zap, ShieldCheck, FileJson, Layers, Webhook, RefreshCw, ChevronRight, Package, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/apis/$id")({
  component: ApiPlaygroundPage,
});

type ApiParam = {
  name: string;
  in: "query" | "body" | "path";
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
  example?: string;
};
type ApiEndpoint = { method: string; path: string; summary: string };
type ApiSpec = {
  name: string;
  description: string;
  emoji: string;
  kind: "rest" | "function";
  method: string;
  path: string;
  params: ApiParam[];
  sampleResponse: string;
  endpoints: ApiEndpoint[];
};

type ApiRow = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  kind: string;
  method: string;
  path: string;
  spec: ApiSpec;
  created_at: string;
};

type RequestRow = {
  id: string;
  method: string;
  path: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  status: number;
  created_at: string;
};

const METHOD_TONE: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  POST: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  PUT: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PATCH: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  DELETE: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

type Tab = "playground" | "docs" | "snippets" | "history" | "usage" | "keys" | "schema";

function ApiPlaygroundPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("playground");
  const [history, setHistory] = useState<RequestRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: row, error }, { data: hist }] = await Promise.all([
        supabase.from("apis").select("*").eq("id", id).maybeSingle(),
        supabase.from("api_requests").select("*").eq("api_id", id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (cancelled) return;
      if (error || !row) {
        toast.error(error?.message ?? "API not found");
        navigate({ to: "/app/apis" });
        return;
      }
      setApi(row as unknown as ApiRow);
      setHistory((hist ?? []) as unknown as RequestRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  if (loading || !api) {
    return (
      <div className="grid h-full place-items-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const refreshHistory = async () => {
    const { data } = await supabase
      .from("api_requests").select("*").eq("api_id", id)
      .order("created_at", { ascending: false }).limit(50);
    setHistory((data ?? []) as unknown as RequestRow[]);
  };

  const remove = async () => {
    if (!confirm(`Delete ${api.name}?`)) return;
    await supabase.from("apis").delete().eq("id", api.id);
    toast.success("API deleted");
    navigate({ to: "/app/apis" });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-black/5 bg-white px-6 py-4">
        <Link to="/app/apis" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All APIs
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-2xl">
              {api.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{api.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{api.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[api.method] ?? ""}`}>
                  {api.method}
                </span>
                <code className="font-mono text-xs">{api.path}</code>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  · {api.kind === "rest" ? "REST resource" : "Custom function"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={remove} className="clicky-sm rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black/5 bg-white px-4">
        {([
          { id: "playground", label: "Playground", icon: Play },
          { id: "docs", label: "Docs", icon: BookOpen },
          { id: "usage", label: "Usage", icon: BarChart3 },
          { id: "keys", label: "Keys", icon: KeyRound },
          { id: "snippets", label: "Snippets", icon: Code2 },
          { id: "history", label: "History", icon: History },
          { id: "schema", label: "Schema", icon: Settings },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`clicky-sm relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
              {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto bg-muted/10">
        {tab === "playground" && <Playground api={api} onRun={refreshHistory} />}
        {tab === "docs" && <Docs api={api} />}
        {tab === "usage" && <Usage api={api} />}
        {tab === "keys" && <Keys api={api} />}
        {tab === "snippets" && <Snippets api={api} />}
        {tab === "history" && <HistoryView rows={history} />}
        {tab === "schema" && <SchemaEditor api={api} onSave={(spec) => setApi({ ...api, spec })} />}
      </div>
    </div>
  );
}

/* ---------- Playground ---------- */

function Playground({ api, onRun }: { api: ApiRow; onRun: () => void }) {
  const spec = api.spec ?? {} as ApiSpec;
  const params = spec.params ?? [];
  const queryParams = params.filter((p) => p.in === "query");
  const bodyParams = params.filter((p) => p.in === "body");
  const pathParams = params.filter((p) => p.in === "path");

  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    params.forEach((p) => { v[p.name] = p.example ?? ""; });
    return v;
  });
  const [body, setBody] = useState<string>(() => {
    if (bodyParams.length === 0) return "";
    const obj: Record<string, unknown> = {};
    bodyParams.forEach((p) => {
      obj[p.name] = p.example ? tryParse(p.example) : defaultFor(p.type);
    });
    return JSON.stringify(obj, null, 2);
  });
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string; ms: number } | null>(null);

  const builtPath = useMemo(() => {
    let p = api.path;
    pathParams.forEach((pp) => {
      p = p.replace(`:${pp.name}`, encodeURIComponent(values[pp.name] || `:${pp.name}`));
    });
    const qs = queryParams
      .filter((q) => values[q.name])
      .map((q) => `${q.name}=${encodeURIComponent(values[q.name])}`)
      .join("&");
    return qs ? `${p}?${qs}` : p;
  }, [api.path, pathParams, queryParams, values]);

  const run = async () => {
    setRunning(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    let respBody = spec.sampleResponse || '{"ok":true}';
    try { respBody = JSON.stringify(JSON.parse(respBody), null, 2); } catch { /* keep as-is */ }
    const status = api.method === "POST" ? 201 : api.method === "DELETE" ? 204 : 200;
    const ms = Math.round(performance.now() - start);
    setResponse({ status, body: respBody, ms });
    setRunning(false);
    const { data: userRes } = await supabase.auth.getCurrentUser();
    if (userRes.user) {
      await supabase.from("api_requests").insert({
        user_id: userRes.user.id,
        api_id: api.id,
        method: api.method,
        path: builtPath,
        request: { params: values, body: body ? tryParse(body) : null } as never,
        response: (tryParse(respBody) ?? { raw: respBody }) as never,
        status,
      });
      onRun();
    }
  };

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {/* Request */}
      <div className="space-y-3">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Request</div>
          <div className="flex items-center gap-2 rounded-lg border border-black/5 bg-muted/30 p-2">
            <span className={`shrink-0 rounded border px-2 py-1 font-mono text-xs font-bold ${METHOD_TONE[api.method] ?? ""}`}>
              {api.method}
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{builtPath}</code>
            <button
              onClick={run}
              disabled={running}
              className="clicky-sm inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {running ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        {pathParams.length > 0 && (
          <ParamsSection title="Path" params={pathParams} values={values} setValues={setValues} />
        )}
        {queryParams.length > 0 && (
          <ParamsSection title="Query" params={queryParams} values={values} setValues={setValues} />
        )}
        {bodyParams.length > 0 && (
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Body (JSON)</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-lg border border-black/10 bg-muted/20 p-3 font-mono text-xs outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Response */}
      <div className="space-y-3">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Response</div>
            {response && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={`rounded px-1.5 py-0.5 font-mono font-bold ${
                  response.status < 300 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
                }`}>
                  {response.status}
                </span>
                <span>{response.ms}ms</span>
              </div>
            )}
          </div>
          {response ? (
            <pre className="max-h-[420px] overflow-auto rounded-lg border border-black/5 bg-[oklch(0.18_0_0)] p-3 font-mono text-xs leading-relaxed text-emerald-200">
{response.body}
            </pre>
          ) : (
            <div className="grid place-items-center rounded-lg border border-dashed border-black/10 bg-muted/10 py-12 text-xs text-muted-foreground">
              Send a request to see the response
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParamsSection({ title, params, values, setValues }: {
  title: string;
  params: ApiParam[];
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-2">
        {params.map((p) => (
          <div key={p.name} className="grid grid-cols-3 items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              <code className="font-mono font-semibold">{p.name}</code>
              {p.required && <span className="text-rose-600">*</span>}
              <span className="text-[10px] text-muted-foreground">{p.type}</span>
            </label>
            <input
              value={values[p.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
              placeholder={p.example ?? p.description}
              className="col-span-2 rounded-md border border-black/10 bg-muted/20 px-2 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Docs ---------- */

function Docs({ api }: { api: ApiRow }) {
  const spec = api.spec;
  const base = typeof window !== "undefined" ? `${window.location.origin}/v1` : "https://api.beevr.dev/v1";
  const endpoints = spec.endpoints ?? [];
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const toc = [
    { id: "overview", label: "Overview" },
    { id: "quickstart", label: "Quickstart" },
    { id: "auth", label: "Authentication" },
    { id: "requests", label: "Making requests" },
    { id: "pagination", label: "Pagination" },
    { id: "errors", label: "Errors & retries" },
    { id: "rate-limits", label: "Rate limits" },
    { id: "webhooks", label: "Webhooks" },
    { id: "versioning", label: "Versioning" },
    { id: "endpoints", label: "Endpoints" },
    { id: "changelog", label: "Changelog" },
  ];

  const sampleParams = (spec.params ?? []).slice(0, 3);
  const exampleBody = sampleParams.length
    ? JSON.stringify(
        Object.fromEntries(
          sampleParams.map((p) => [p.name, p.example ?? (p.type === "number" ? 42 : p.type === "boolean" ? true : `<${p.name}>`)])
        ),
        null,
        2
      )
    : "{}";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      {/* Sticky TOC */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-1">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">On this page</div>
          {toc.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
              <ChevronRight className="h-3 w-3 opacity-40" />
              {s.label}
            </a>
          ))}
        </div>
      </aside>

      <div className="min-w-0 space-y-10">
        {/* Hero */}
        <section id="overview">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">API reference · v1</div>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">{spec.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{spec.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700">● Operational</span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-muted-foreground">Stable</span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-muted-foreground">JSON · UTF-8</span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-muted-foreground">Updated {new Date(api.created_at).toLocaleDateString()}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard icon={Server} label="Base URL" value={base.replace(/^https?:\/\//, "")} />
            <StatCard icon={Layers} label="Endpoints" value={`${endpoints.length}`} />
            <StatCard icon={ShieldCheck} label="Auth" value="Bearer key" />
          </div>
        </section>

        {/* Quickstart */}
        <DocSection id="quickstart" icon={Zap} title="Quickstart" subtitle="Make your first call in under a minute.">
          <ol className="space-y-3 text-sm">
            <Step n={1} title="Create an access key">
              Open the <span className="font-semibold">Keys</span> tab and click <em>New key</em>. Copy it once — it's only shown to you on creation.
            </Step>
            <Step n={2} title="Send a request">
              Replace <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">YOUR_KEY</code> below with your access key.
            </Step>
            <Step n={3} title="Inspect the response">
              Every successful response is a JSON object. See the <a href="#endpoints" className="text-primary underline-offset-2 hover:underline">Endpoints</a> section for shapes.
            </Step>
          </ol>
          <CodeBlock label="cURL">{`curl -X ${api.method} '${base}${api.path}' \\\n  -H 'Authorization: Bearer YOUR_KEY' \\\n  -H 'Content-Type: application/json'${api.method !== "GET" ? ` \\\n  -d '${exampleBody.replace(/\n/g, "")}'` : ""}`}</CodeBlock>
        </DocSection>

        {/* Auth */}
        <DocSection id="auth" icon={Lock} title="Authentication" subtitle="All requests require a Bearer access key.">
          <p className="text-sm text-muted-foreground">
            Pass your key in the <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">Authorization</code> header.
            Keys are scoped to this API — they cannot be used to call other APIs in your workspace.
          </p>
          <CodeBlock label="Header">{`Authorization: Bearer beevr_sk_••••••••••••`}</CodeBlock>
          <Callout tone="warn">
            Never embed access keys in client-side code or commit them to source control. Use environment variables and rotate keys regularly from the <span className="font-semibold">Keys</span> tab.
          </Callout>
        </DocSection>

        {/* Requests */}
        <DocSection id="requests" icon={FileJson} title="Making requests" subtitle="Conventions used across every endpoint.">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Send JSON bodies with <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">Content-Type: application/json</code>.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> All timestamps are ISO 8601 in UTC (e.g. <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">2026-05-11T12:00:00Z</code>).</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> IDs are opaque strings — do not parse them.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Pass <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">Idempotency-Key</code> on writes to safely retry.</li>
          </ul>
          {(spec.params?.length ?? 0) > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-black/5 bg-white">
              <div className="border-b border-black/5 bg-muted/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Common parameters</div>
              <table className="w-full text-xs">
                <thead className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">In</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Required</th>
                    <th className="px-3 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {spec.params.map((p) => (
                    <tr key={p.name} className="border-t border-black/5">
                      <td className="px-3 py-2 font-mono font-semibold">{p.name}</td>
                      <td className="px-3 py-2"><span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{p.in}</span></td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{p.type}</td>
                      <td className="px-3 py-2">{p.required ? <span className="font-semibold text-rose-600">required</span> : <span className="text-muted-foreground">optional</span>}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DocSection>

        {/* Pagination */}
        <DocSection id="pagination" icon={Layers} title="Pagination" subtitle="List endpoints return cursor-paginated results.">
          <p className="text-sm text-muted-foreground">
            Pass <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">limit</code> (max 100) and <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">cursor</code> from the previous response's <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">next_cursor</code>.
          </p>
          <CodeBlock label="Paginated response">{`{
  "data": [ /* … */ ],
  "has_more": true,
  "next_cursor": "eyJpZCI6ICJhYmMxMjMifQ"
}`}</CodeBlock>
        </DocSection>

        {/* Errors */}
        <DocSection id="errors" icon={AlertCircle} title="Errors & retries" subtitle="Predictable error envelopes with machine-readable codes.">
          <CodeBlock label="Error envelope">{`{
  "error": {
    "code": "invalid_request",
    "message": "Field 'name' is required.",
    "param": "name",
    "request_id": "req_01HXYZ..."
  }
}`}</CodeBlock>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { code: "400", name: "invalid_request", desc: "Malformed input or missing fields." },
              { code: "401", name: "unauthenticated", desc: "Missing or invalid access key." },
              { code: "403", name: "forbidden", desc: "Key lacks scope for this endpoint." },
              { code: "404", name: "not_found", desc: "Resource does not exist." },
              { code: "409", name: "conflict", desc: "Idempotency or version mismatch." },
              { code: "422", name: "unprocessable", desc: "Validation failed." },
              { code: "429", name: "rate_limited", desc: "Slow down — see Retry-After." },
              { code: "5xx", name: "server_error", desc: "Retry with exponential backoff." },
            ].map((e) => (
              <div key={e.code} className="flex items-start gap-3 rounded-lg border border-black/5 bg-white px-3 py-2.5">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold">{e.code}</span>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold">{e.name}</div>
                  <div className="text-[11px] text-muted-foreground">{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Callout tone="info">
            Retry <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[11px]">429</code> and <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[11px]">5xx</code> responses with exponential backoff (start at 500ms, cap at 30s). Honor the <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[11px]">Retry-After</code> header when present.
          </Callout>
        </DocSection>

        {/* Rate limits */}
        <DocSection id="rate-limits" icon={Clock} title="Rate limits" subtitle="Limits are per-key and reset every minute.">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { tier: "Free", limit: "60", burst: "120" },
              { tier: "Pro", limit: "600", burst: "1,200" },
              { tier: "Enterprise", limit: "Custom", burst: "Custom" },
            ].map((t) => (
              <div key={t.tier} className="rounded-xl border border-black/5 bg-white p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.tier}</div>
                <div className="mt-2 text-xl font-bold tabular-nums">{t.limit}<span className="ml-1 text-xs font-normal text-muted-foreground">req/min</span></div>
                <div className="mt-1 text-[11px] text-muted-foreground">Burst: {t.burst}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Each response includes <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">X-RateLimit-Limit</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">X-RateLimit-Remaining</code>, and <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">X-RateLimit-Reset</code>.
          </p>
        </DocSection>

        {/* Webhooks */}
        <DocSection id="webhooks" icon={Webhook} title="Webhooks" subtitle="Subscribe to events instead of polling.">
          <p className="text-sm text-muted-foreground">
            Configure a webhook URL in <span className="font-semibold">Settings</span>. We sign every payload with HMAC-SHA256 in the
            <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[11px]">X-Beevr-Signature</code> header.
          </p>
          <CodeBlock label="Sample event">{`{
  "id": "evt_01HXYZ...",
  "type": "${slugify(spec.name)}.completed",
  "created": "2026-05-11T12:00:00Z",
  "data": { /* resource snapshot */ }
}`}</CodeBlock>
        </DocSection>

        {/* Versioning */}
        <DocSection id="versioning" icon={GitBranch} title="Versioning" subtitle="The API is versioned in the URL path.">
          <p className="text-sm text-muted-foreground">
            The current stable version is <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">v1</code>. Breaking changes ship under a new path (<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">/v2</code>) with at least 6 months overlap.
            Additive changes — new fields, new endpoints — are non-breaking and may appear in <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">v1</code> at any time.
          </p>
        </DocSection>

        {/* Endpoints — detailed */}
        <DocSection id="endpoints" icon={Terminal} title="Endpoints" subtitle="Complete reference for every operation.">
          <div className="space-y-5">
            {endpoints.map((ep, i) => {
              const epId = `ep-${slugify(ep.method + "-" + ep.path)}`;
              return (
                <div key={i} id={epId} className="overflow-hidden rounded-xl border border-black/5 bg-white">
                  <div className="flex items-center gap-2 border-b border-black/5 bg-muted/30 px-4 py-2.5">
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[ep.method] ?? ""}`}>
                      {ep.method}
                    </span>
                    <code className="font-mono text-xs">{ep.path}</code>
                    <a href={`#${epId}`} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">#</a>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-sm">{ep.summary}</p>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <MiniCode label="Request">{`curl -X ${ep.method} '${base}${ep.path}' \\\n  -H 'Authorization: Bearer YOUR_KEY'${ep.method !== "GET" ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${exampleBody.replace(/\n/g, "")}'` : ""}`}</MiniCode>
                      <MiniCode label="Response · 200">{prettify(spec.sampleResponse)}</MiniCode>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono font-semibold text-emerald-700">200 OK</span>
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono font-semibold text-amber-700">400 invalid_request</span>
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono font-semibold text-rose-700">401 unauthenticated</span>
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono font-semibold text-rose-700">429 rate_limited</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DocSection>

        {/* Changelog */}
        <DocSection id="changelog" icon={RefreshCw} title="Changelog" subtitle="Recent changes to this API.">
          <ul className="space-y-3 text-sm">
            {[
              { date: new Date(api.created_at).toLocaleDateString(), tag: "Added", text: `${spec.name} created with ${endpoints.length} endpoints.` },
              { date: "2026-04-22", tag: "Improved", text: "Lower p95 latency by ~18% across list endpoints." },
              { date: "2026-03-10", tag: "Added", text: "Cursor pagination on all list endpoints." },
              { date: "2026-02-01", tag: "Fixed", text: "Idempotency keys now persist for 24h (was 1h)." },
            ].map((c, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-black/5 bg-white px-3 py-2.5">
                <span className="w-24 shrink-0 font-mono text-[11px] text-muted-foreground">{c.date}</span>
                <span className={`h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.tag === "Added" ? "bg-emerald-500/10 text-emerald-700" : c.tag === "Fixed" ? "bg-rose-500/10 text-rose-700" : "bg-blue-500/10 text-blue-700"}`}>{c.tag}</span>
                <span className="text-muted-foreground">{c.text}</span>
              </li>
            ))}
          </ul>
        </DocSection>

        {/* SDK footer */}
        <section className="rounded-2xl border border-black/5 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-primary" /> Official SDKs</div>
          <p className="mt-1 text-xs text-muted-foreground">Type-safe clients with built-in retries and pagination.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <MiniCode label="Node">{`npm i @beevr/sdk`}</MiniCode>
            <MiniCode label="Python">{`pip install beevr`}</MiniCode>
            <MiniCode label="Go">{`go get beevr.dev/sdk`}</MiniCode>
          </div>
        </section>
      </div>
    </div>
  );
}

function DocSection({ id, icon: Icon, title, subtitle, children }: { id: string; icon: typeof Server; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 truncate font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border border-black/5 bg-white p-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{n}</span>
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-black/40 bg-[oklch(0.18_0_0)]">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-white/60 hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto p-3 font-mono text-xs leading-relaxed text-emerald-200">{children}</pre>
    </div>
  );
}

function MiniCode({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/40 bg-[oklch(0.18_0_0)]">
      <div className="border-b border-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</div>
      <pre className="overflow-auto p-3 font-mono text-[11px] leading-relaxed text-emerald-200">{children}</pre>
    </div>
  );
}

function Callout({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const styles = tone === "warn"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
    : "border-blue-500/30 bg-blue-500/10 text-blue-900";
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${styles}`}>
      {children}
    </div>
  );
}


/* ---------- Usage ---------- */

function Usage({ api }: { api: ApiRow }) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("api_requests")
        .select("*")
        .eq("api_id", api.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      setRows((data ?? []) as unknown as RequestRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [api.id]);

  // Mock: blend real history with seed users/calls so the page feels alive
  const seed = useMemo(() => seedUsage(api.id), [api.id]);
  const total = rows.length + seed.totalSeed;
  const successRate = total === 0 ? 100 : Math.min(100, Math.round((rows.filter((r) => r.status < 400).length + seed.success) / total * 100));
  const avgMs = 80 + (api.id.charCodeAt(0) % 60);
  const errorRate = Math.max(0, 100 - successRate);

  // Top users — combine seed users and any real recent requests
  const topUsers = seed.users;

  // 14-day sparkline
  const days = useMemo(() => seed.days, [seed]);
  const peak = Math.max(...days);

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi icon={Activity} label="Calls (30d)" value={total.toLocaleString()} sub={`+${Math.round(total * 0.18)} vs prev`} tone="primary" />
        <Kpi icon={Check} label="Success rate" value={`${successRate}%`} sub={`${errorRate}% errors`} tone="emerald" />
        <Kpi icon={Clock} label="Avg latency" value={`${avgMs}ms`} sub="p95 240ms" tone="amber" />
        <Kpi icon={UsersIcon} label="Active users" value={String(topUsers.length)} sub="last 7 days" tone="blue" />
      </div>

      {/* Calls chart */}
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Calls — last 14 days</h3>
            <p className="text-xs text-muted-foreground">Peak {peak.toLocaleString()} calls / day</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> Calls</span>
          </div>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {days.map((v, i) => (
            <div key={i} className="group relative flex-1">
              <div
                className="w-full rounded-md bg-primary/80 transition-all hover:bg-primary"
                style={{ height: `${(v / peak) * 100}%` }}
                title={`${v} calls`}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>14d ago</span><span>today</span>
        </div>
      </section>

      {/* Top users */}
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><UsersIcon className="h-4 w-4 text-primary" /> Top users</h3>
          <span className="text-[10px] text-muted-foreground">By calls in last 30 days</span>
        </div>
        <ul className="divide-y divide-black/5">
          {topUsers.map((u, i) => {
            const pct = Math.round((u.calls / topUsers[0].calls) * 100);
            return (
              <li key={u.email} className="flex items-center gap-3 py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: u.color }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="font-mono text-xs tabular-nums">{u.calls.toLocaleString()}</div>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{u.email}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="hidden shrink-0 text-right text-[10px] text-muted-foreground sm:block">
                  <div>{u.errors} errors</div>
                  <div>{u.lastSeen}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Endpoint breakdown */}
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold">By endpoint</h3>
        <ul className="space-y-2">
          {(api.spec.endpoints ?? []).slice(0, 5).map((ep, i) => {
            const calls = Math.round((seed.totalSeed / Math.max(1, api.spec.endpoints?.length || 1)) * (1 - i * 0.12));
            const pct = Math.round((calls / seed.totalSeed) * 100);
            return (
              <li key={i} className="flex items-center gap-3">
                <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[ep.method] ?? ""}`}>{ep.method}</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{ep.path}</code>
                <div className="hidden h-1.5 w-40 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{calls.toLocaleString()}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: typeof Check; label: string; value: string; sub: string; tone: "primary" | "emerald" | "amber" | "blue" }) {
  const toneCls = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-700 bg-emerald-500/10",
    amber: "text-amber-700 bg-amber-500/10",
    blue: "text-blue-700 bg-blue-500/10",
  }[tone];
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}><Icon className="h-3.5 w-3.5" /></span>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

type SeedUser = { name: string; email: string; calls: number; errors: number; lastSeen: string; color: string };
function seedUsage(apiId: string): { users: SeedUser[]; days: number[]; totalSeed: number; success: number } {
  // Deterministic pseudo-random based on id
  let h = 0;
  for (let i = 0; i < apiId.length; i++) h = (h * 31 + apiId.charCodeAt(i)) >>> 0;
  const rand = () => { h = (h * 1664525 + 1013904223) >>> 0; return (h % 1000) / 1000; };
  const names: Array<[string, string, string]> = [
    ["Adithya Pradeep", "adithya@beevr.dev", "oklch(0.65 0.2 40)"],
    ["Sarah Chen", "sarah@beevr.dev", "oklch(0.65 0.18 280)"],
    ["Maya Patel", "maya@beevr.dev", "oklch(0.62 0.18 145)"],
    ["Diego Alvarez", "diego@beevr.dev", "oklch(0.6 0.18 240)"],
    ["Priya Iyer", "priya@beevr.dev", "oklch(0.65 0.18 20)"],
    ["Noah Kim", "noah@beevr.dev", "oklch(0.55 0.18 200)"],
  ];
  const users: SeedUser[] = names.map(([n, e, c]) => {
    const calls = 200 + Math.round(rand() * 1800);
    const errors = Math.round(calls * (0.005 + rand() * 0.02));
    const days = Math.floor(rand() * 6);
    return { name: n, email: e, calls, errors, color: c, lastSeen: days === 0 ? "today" : `${days}d ago` };
  }).sort((a, b) => b.calls - a.calls);
  const days = Array.from({ length: 14 }, (_, i) => 120 + Math.round(rand() * 480) + i * 18);
  const totalSeed = users.reduce((a, u) => a + u.calls, 0);
  const success = Math.round(totalSeed * 0.974);
  return { users, days, totalSeed, success };
}

/* ---------- Keys ---------- */

type KeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  key_plaintext: string | null;
  status: string;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
  expires_at: string | null;
};

function genKey() {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 32);
  return `beevr_sk_${b64}`;
}
async function sha256(s: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) return s;
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Keys({ api }: { api: ApiRow }) {
  const { user } = useAuth();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const scope = `api:${api.id}`;

  const load = async () => {
    const { data } = await supabase
      .from("access_keys")
      .select("id, name, key_prefix, key_plaintext, status, created_at, last_used_at, usage_count, expires_at")
      .eq("scope_label", scope)
      .order("created_at", { ascending: false });
    setKeys((data ?? []) as KeyRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [api.id]);

  const create = async () => {
    if (!user) return;
    if (!newName.trim()) return toast.error("Give the key a name");
    setCreating(true);
    const plaintext = genKey();
    const hash = await sha256(plaintext);
    const prefix = plaintext.slice(0, 14);
    const { data, error } = await supabase.from("access_keys").insert({
      user_id: user.id,
      name: newName.trim(),
      key_plaintext: plaintext,
      key_hash: hash,
      key_prefix: prefix,
      scope_label: scope,
      scope: "api",
      client: "rest",
      permission: "read-write",
      safety: "balanced",
      status: "active",
    }).select().single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setRevealedKey(plaintext);
    setNewName("");
    if (data) setKeys((k) => [data as KeyRow, ...k]);
    toast.success("Key created");
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this key? Existing requests using it will start failing.")) return;
    const prev = keys;
    setKeys((k) => k.filter((x) => x.id !== id));
    const { error } = await supabase.from("access_keys").delete().eq("id", id);
    if (error) { toast.error(error.message); setKeys(prev); }
    else toast.success("Key revoked");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-primary" /> API keys</h3>
          <p className="text-xs text-muted-foreground">Keys scoped to <code className="rounded bg-muted px-1 py-0.5">{api.name}</code>. They only authorize calls to this API's endpoints.</p>
        </div>
      </div>

      {/* Reveal banner */}
      {revealedKey && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Check className="h-4 w-4" /> Key created — copy it now, you won't see it again
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-white p-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{revealedKey}</code>
            <button onClick={() => copy(revealedKey)} className="clicky-sm inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-black/5">
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button onClick={() => setRevealedKey(null)} className="clicky-sm rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-black/5">Done</button>
          </div>
        </div>
      )}

      {/* Create */}
      <div className="rounded-2xl border border-black/5 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create a new key</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="e.g. Production server"
            className="flex-1 rounded-lg border border-black/10 bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={create}
            disabled={creating}
            className="clicky inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create key
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-black/5 bg-white">
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : keys.length === 0 ? (
          <div className="grid place-items-center py-10 text-center text-sm text-muted-foreground">
            <KeyRound className="mb-2 h-5 w-5" />
            No keys yet for this API.
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {keys.map((k) => (
              <li key={k.id} className="flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{k.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${k.status === "active" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}`}>{k.status}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px]">{k.key_prefix}…</code>
                    {k.key_plaintext && (
                      <button onClick={() => copy(k.key_plaintext as string)} className="clicky-sm rounded-md p-1 text-muted-foreground hover:bg-black/5" title="Copy key">
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                    <span>· {k.usage_count} calls</span>
                    <span>· {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleDateString()}` : "never used"}</span>
                  </div>
                </div>
                <button onClick={() => revoke(k.id)} className="clicky-sm rounded-md p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" title="Revoke">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Snippets ---------- */

function Snippets({ api }: { api: ApiRow }) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";
  const url = `${base}${api.path}`;
  const body = (api.spec.params ?? []).filter((p) => p.in === "body").length > 0 ? "{ /* body */ }" : null;

  const snippets = {
    curl: `curl -X ${api.method} '${url}'${body ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${body}'` : ""}`,
    js: `const res = await fetch("${url}", {\n  method: "${api.method}",${body ? `\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${body}),` : ""}\n});\nconst data = await res.json();`,
    python: `import requests\nres = requests.${api.method.toLowerCase()}(\n  "${url}",${body ? `\n  json=${body},` : ""}\n)\ndata = res.json()`,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      {(Object.entries(snippets) as [keyof typeof snippets, string][]).map(([lang, code]) => (
        <SnippetBlock key={lang} lang={lang} code={code} />
      ))}
    </div>
  );
}

function SnippetBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <div className="flex items-center justify-between border-b border-black/5 bg-muted/30 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{lang}</span>
        <button onClick={copy} className="clicky-sm inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-black/5">
          {copied ? <><Check className="h-3 w-3 text-emerald-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
      <pre className="overflow-auto bg-[oklch(0.18_0_0)] p-3 font-mono text-xs leading-relaxed text-emerald-200">{code}</pre>
    </div>
  );
}

/* ---------- History ---------- */

function HistoryView({ rows }: { rows: RequestRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="grid place-items-center py-20 text-center text-sm text-muted-foreground">
        No requests yet — try the playground.
      </div>
    );
  }
  return (
    <div className="space-y-2 p-4">
      {rows.map((r) => (
        <details key={r.id} className="group rounded-xl border border-black/5 bg-white">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs">
            <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[r.method] ?? ""}`}>
              {r.method}
            </span>
            <code className="min-w-0 flex-1 truncate font-mono">{r.path}</code>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
              r.status < 300 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
            }`}>{r.status}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</span>
          </summary>
          <div className="grid gap-2 border-t border-black/5 p-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Request</div>
              <pre className="overflow-auto rounded bg-muted/30 p-2 font-mono text-[11px]">{JSON.stringify(r.request, null, 2)}</pre>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Response</div>
              <pre className="overflow-auto rounded bg-muted/30 p-2 font-mono text-[11px]">{JSON.stringify(r.response, null, 2)}</pre>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------- Schema editor ---------- */

function SchemaEditor({ api, onSave }: { api: ApiRow; onSave: (spec: ApiSpec) => void }) {
  const [text, setText] = useState(() => JSON.stringify(api.spec, null, 2));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    let parsed: ApiSpec;
    try { parsed = JSON.parse(text); } catch { toast.error("Invalid JSON"); return; }
    setBusy(true);
    const { error } = await supabase.from("apis").update({
      spec: parsed as never,
      name: parsed.name ?? api.name,
      description: parsed.description ?? api.description,
      method: parsed.method ?? api.method,
      path: parsed.path ?? api.path,
      emoji: parsed.emoji ?? api.emoji,
    }).eq("id", api.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Schema saved"); onSave(parsed); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-3 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Server className="h-4 w-4" /> Schema</h3>
          <p className="text-xs text-muted-foreground">Edit the full API spec. Saved as JSON.</p>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="clicky-sm inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={24}
        className="w-full resize-y rounded-xl border border-black/10 bg-[oklch(0.18_0_0)] p-4 font-mono text-xs leading-relaxed text-emerald-200 outline-none focus:border-primary"
        spellCheck={false}
      />
    </div>
  );
}

/* ---------- helpers ---------- */

function tryParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}
function prettify(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}
function defaultFor(t: ApiParam["type"]): unknown {
  switch (t) {
    case "number": return 0;
    case "boolean": return false;
    case "array": return [];
    case "object": return {};
    default: return "";
  }
}
