import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { createAgentFromPrompt } from "@/lib/agents.functions";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

const search = z.object({ prompt: z.string().optional() });

export const Route = createFileRoute("/app/agents/new")({
  validateSearch: search,
  component: NewAgent,
});

function NewAgent() {
  const { prompt: initial } = Route.useSearch();
  const [prompt, setPrompt] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const create = useServerFn(createAgentFromPrompt);

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const agent = await create({ data: { prompt: prompt.trim() } });
      toast.success("Agent created");
      navigate({ to: "/app/agents/$id", params: { id: agent.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create agent");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link to="/app/agents" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Agents
      </Link>
      <PageHeader title="Build an agent" subtitle="Describe what it should do — AI will generate the workflow." />

      <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Describe your agent
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="e.g. Every Friday at 4pm, summarize the week's closed deals from HubSpot and post to #sales"
          className="w-full resize-none rounded-xl border border-black/[0.06] bg-white p-3 text-sm outline-none focus:border-primary/40"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Powered by Lovable AI</div>
          <button
            onClick={submit}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Designing…</> : <>Generate agent</>}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-2 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">Examples</div>
        {[
          "Triage incoming Gmail and label by department",
          "Pull Linear issues created today and post a digest in #product",
          "When a Stripe payment fails, draft a recovery email and add to outbox",
        ].map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-black/[0.06] hover:bg-white/60"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
