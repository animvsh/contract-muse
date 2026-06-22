import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Plus, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/app/agents/")({
  component: Agents,
});

type Agent = { id: string; name: string; description: string | null; status: string; runs_count: number };

function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agents")
      .select("id,name,description,status,runs_count")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAgents((data as Agent[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <PageHeader
        title="Agents"
        subtitle="AI workers running on your data"
        action={
          <Link
            to="/app/agents/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New agent
          </Link>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/40 p-12 text-center">
          <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium">No agents yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Describe an agent and let AI build the workflow.</p>
          <Link
            to="/app/agents/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create your first agent
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((a) => (
            <Link
              key={a.id}
              to="/app/agents/$id"
              params={{ id: a.id }}
              className="flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white/70 p-4 backdrop-blur transition-colors hover:border-primary/30 hover:bg-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{a.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                    {a.status}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{a.description}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" /> {a.runs_count} runs
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
