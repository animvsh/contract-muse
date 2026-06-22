import { useEffect, useState } from "react";
import { Sparkles, Brain } from "lucide-react";

export function ReasoningSteps({ log, live = false }: { log: string; live?: boolean }) {
  const lines = log
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const summary = lines[0]?.startsWith("•") ? null : lines[0];
  const bullets = lines.filter((l) => l.startsWith("•")).map((l) => l.replace(/^•\s*/, ""));

  // Stagger reveal
  const [shown, setShown] = useState(live ? 0 : bullets.length);
  useEffect(() => {
    if (!live) {
      setShown(bullets.length);
      return;
    }
    setShown(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= bullets.length) clearInterval(t);
    }, 350);
    return () => clearInterval(t);
  }, [log, live, bullets.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[oklch(0.72_0.21_45)]/10 blur-3xl" />

      {summary && (
        <div className="relative mb-4 flex items-start gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[oklch(0.72_0.21_45)] text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <div className="flex-1 pt-0.5 text-sm font-medium leading-relaxed text-foreground">{summary}</div>
        </div>
      )}

      <div className="relative ml-3 space-y-2.5 border-l border-dashed border-black/[0.08] pl-5">
        {bullets.slice(0, shown).map((b, i) => (
          <div
            key={i}
            className="slide-in-left relative"
          >
            <span className="absolute -left-[26px] top-1.5 grid h-3 w-3 place-items-center rounded-full bg-white ring-2 ring-[oklch(0.72_0.21_45)]/40">
              <span className="h-1 w-1 rounded-full bg-[oklch(0.72_0.21_45)]" />
            </span>
            <div className="text-xs leading-relaxed text-foreground/80">{b}</div>
          </div>
        ))}
        {live && shown < bullets.length && (
          <div className="relative">
            <span className="absolute -left-[26px] top-1.5 grid h-3 w-3 place-items-center rounded-full bg-white ring-2 ring-[oklch(0.72_0.21_45)]">
              <span className="h-1 w-1 animate-ping rounded-full bg-[oklch(0.72_0.21_45)]" />
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" /> thinking
              <span className="inline-flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
