import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/approvals")({
  component: Approvals,
});

const PENDING = [
  { id: "1", agent: "Contract Sender", action: "Send employment contract to maya@beevr.dev", time: "2m ago" },
  { id: "2", agent: "Inbox Triage", action: "Auto-reply to 3 vendor emails with templated response", time: "11m ago" },
  { id: "3", agent: "Sales Digest", action: "Post weekly digest to #sales-leadership", time: "1h ago" },
];

function Approvals() {
  const [resolved, setResolved] = useState<Record<string, "approved" | "rejected">>({});

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Approvals</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review actions agents want to take on your behalf.</p>

      <div className="mt-8 space-y-3">
        {PENDING.map((p) => {
          const state = resolved[p.id];
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.agent} · {p.time}</div>
                  <div className="mt-1 font-medium">{p.action}</div>
                </div>
                {state ? (
                  <span className={`rounded-md px-3 py-1.5 text-xs font-medium ${state === "approved" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {state === "approved" ? "Approved" : "Rejected"}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolved((r) => ({ ...r, [p.id]: "rejected" }))}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                    <button
                      onClick={() => setResolved((r) => ({ ...r, [p.id]: "approved" }))}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
