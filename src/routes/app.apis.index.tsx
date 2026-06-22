import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server, Plus, Trash2, PlayCircle, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/apis/")({
  component: ApisPage,
});

type ApiRow = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  kind: string;
  method: string;
  path: string;
  created_at: string;
};

const METHOD_TONE: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  POST: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  PUT: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PATCH: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  DELETE: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

const ENABLED_KEY = "beevr.apis.enabled.v1";
function loadEnabledMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ENABLED_KEY) || "{}"); } catch { return {}; }
}
function saveEnabledMap(m: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENABLED_KEY, JSON.stringify(m));
}

function ApisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => loadEnabledMap());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("apis")
        .select("id, name, description, emoji, kind, method, path, created_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) toast.error(error.message);
      setRows((data ?? []) as ApiRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const remove = async (id: string) => {
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await supabase.from("apis").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setRows(prev);
    } else {
      toast.success("API deleted");
    }
  };

  const toggleEnabled = (id: string) => {
    setEnabledMap((prev) => {
      const isOn = prev[id] !== false; // default enabled
      const next = { ...prev, [id]: !isOn };
      saveEnabledMap(next);
      toast.success(isOn ? "API disabled" : "API enabled");
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-black/5 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Server className="h-6 w-6 text-primary" /> APIs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mock APIs you've created. Each has a playground, docs, request history, and code snippets.
            </p>
          </div>
          <Link
            to="/app/brain"
            search={{ q: "Create an API for tasks with title, status, and due date" }}
            className="clicky inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New API in chat
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-black/10 bg-muted/20 p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-semibold">No APIs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask the chat to "create an API for X" and Beevr will draft one for you.
            </p>
            <Link
              to="/app/brain"
              search={{ q: "Create an API for a bookstore with books and orders" }}
              className="clicky mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Try it
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((api) => {
              const enabled = enabledMap[api.id] !== false;
              return (
                <div
                  key={api.id}
                  className={`clicky-sm group relative cursor-pointer rounded-2xl border bg-white p-4 transition hover:border-primary/30 hover:shadow-lg ${enabled ? "border-black/5" : "border-black/10 opacity-60"}`}
                  onClick={() => navigate({ to: "/app/apis/$id", params: { id: api.id } })}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-xl">
                      {api.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{api.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{api.description}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(api.id); }}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-black/15"}`}
                      title={enabled ? "Disable API" : "Enable API"}
                      aria-label="Toggle API enabled"
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[api.method] ?? ""}`}>
                      {api.method}
                    </span>
                    <code className="min-w-0 truncate font-mono text-xs text-muted-foreground">{api.path}</code>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${enabled ? "text-primary" : "text-muted-foreground"}`}>
                      {enabled ? <><PlayCircle className="h-3 w-3" /> Open playground</> : <><Power className="h-3 w-3" /> Disabled</>}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(api.id); }}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-600"
                      aria-label="Delete API"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
