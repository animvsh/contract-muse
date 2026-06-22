import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight, Sparkles, Phone, User, Briefcase, Loader2, Check, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Join the waitlist — Beevr" }] }),
  component: Onboarding,
});

const fieldClass =
  "w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[15px] text-[oklch(0.18_0_0)] placeholder:text-[oklch(0.6_0_0)] outline-none transition-[border-color,box-shadow] focus:border-[oklch(0.68_0.22_40)] focus:ring-4 focus:ring-[oklch(0.68_0.22_40)]/12";

const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.5_0_0)]";

function Onboarding() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [building, setBuilding] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = name.trim().length > 0 && emailOk && phone.trim().length >= 5 && building.trim().length > 0;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("waitlist_submissions").insert({
        email: email.trim().toLowerCase(),
        full_name: name.trim(),
        phone: phone.trim(),
        business: building.trim(),
        goal: building.trim(),
      });
      if (error) throw error;
      // Fire-and-forget confirmation email (don't block UX if email infra not ready)
      try {
        await fetch("/api/public/waitlist-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() }),
        });
      } catch {
        /* no-op */
      }
      toast.success("You're on the list!", { description: "Check your inbox — confirmation sent." });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.985_0.012_85)] text-[oklch(0.15_0_0)]">
      <div className="pointer-events-none absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full bg-[oklch(0.78_0.18_55)] opacity-[0.18] blur-[160px]" />
      <div className="pointer-events-none absolute -right-48 top-1/3 h-[560px] w-[560px] rounded-full bg-[oklch(0.78_0.18_55)] opacity-[0.14] blur-[160px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1080px] flex-col px-4 py-5 md:px-8 md:py-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="clicky-sm flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight">Beevr</span>
          </Link>
          <Link
            to="/auth"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-[oklch(0.45_0_0)] transition-colors hover:bg-black/[0.04] hover:text-[oklch(0.15_0_0)]"
          >
            Have an account? <span className="font-semibold text-[oklch(0.62_0.22_40)]">Sign in</span>
          </Link>
        </header>

        <div className="mx-auto mt-8 w-full max-w-[640px] flex-1">
          <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/85 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.12),0_4px_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            {!submitted ? (
              <div className="px-6 pb-7 pt-7 md:px-9 md:pb-9 md:pt-9">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.68_0.22_40)]/25 bg-[oklch(0.97_0.05_70)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.62_0.22_40)]">
                  <Sparkles className="h-3 w-3" /> Private beta
                </div>
                <h1 className="font-display mt-4 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">Join the <span className="font-display-italic">Beevr</span> waitlist</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-[oklch(0.45_0_0)]">
                  Tell us what you're building and we'll reach out personally to get you set up.
                </p>

                <div className="mt-7 space-y-5">
                  <div>
                    <label className={labelClass}>Your name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.55_0_0)]" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ada Lovelace"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${fieldClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.55_0_0)]" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="ada@yourcompany.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${fieldClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Phone number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.55_0_0)]" />
                      <input
                        type="tel"
                        placeholder="+1 555 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${fieldClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>What are you building?</label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-[oklch(0.55_0_0)]" />
                      <textarea
                        rows={3}
                        placeholder="e.g. SaaS for dentists — want Beevr to summarize revenue and answer ops questions."
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className={`${fieldClass} pl-10 resize-none`}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submit}
                  disabled={!valid || busy}
                  className="clicky shine group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.68_0.22_40)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/30 transition-all hover:bg-[oklch(0.62_0.22_40)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {busy ? "Submitting…" : "Join the waitlist"}
                  {!busy && <ArrowRight className="nudge-x h-4 w-4" />}
                </button>

                <p className="mt-4 text-center text-xs text-[oklch(0.5_0_0)]">
                  We review applications weekly and reach out personally.
                </p>
              </div>
            ) : (
              <SuccessStep name={name} email={email} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessStep({ name, email }: { name: string; email: string }) {
  const first = name.trim().split(" ")[0] || "there";

  return (
    <div className="px-6 pb-7 pt-7 md:px-9 md:pb-9 md:pt-9">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.55_0.18_140)]/30 bg-[oklch(0.96_0.06_140)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.45_0.18_140)]">
        <Check className="h-3 w-3" /> You're on the list
      </div>
      <h1 className="font-display mt-4 text-[30px] font-semibold tracking-[-0.02em] md:text-[36px]">
        Nice to meet you, <span className="font-display-italic">{first}.</span>
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[oklch(0.45_0_0)]">
        We review applications weekly and reach out personally to walk you through your stack and get you set up live.
      </p>

      <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[oklch(0.97_0.02_85)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.68_0.22_40)]/10">
            <Mail className="h-5 w-5 text-[oklch(0.62_0.22_40)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[oklch(0.15_0_0)]">Confirmation sent</p>
            <p className="mt-1 text-sm text-[oklch(0.45_0_0)]">
              Check <span className="font-medium text-[oklch(0.15_0_0)]">{email}</span> for a welcome note. If you don't see it, check your spam folder.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[oklch(0.5_0_0)]">
        <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.22_40)]" />
        We'll be in touch within a week.
      </div>
    </div>
  );
}
