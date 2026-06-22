import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ArrowRight, Check, Sparkles, Zap, Shield, Bot, FileText, MessageSquare, Mail, Send, Upload, FileStack, Paperclip, Search, TrendingUp, Plug, LineChart, Lock } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import { BrandLogo } from "@/components/brand-logo";
import foundersIncLogo from "@/assets/founders-inc.png";
import { LillyEasterEgg } from "@/components/lilly-easter-egg";

// Reveal-on-scroll wrapper
function Reveal({
  children,
  className = "",
  delay = 0,
  as: As = "div" as ElementType,
}: {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setVis(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const delayClass = delay ? `reveal-delay-${delay}` : "";
  const Cmp: any = As;
  return (
    <Cmp ref={ref} className={`reveal ${delayClass} ${vis ? "is-visible" : ""} ${className}`}>
      {children}
    </Cmp>
  );
}

// Mouse-parallax for ambient orbs
function useParallax(strength = 1) {
  const [xy, setXY] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        setXY({ x: ((e.clientX - cx) / cx) * 24 * strength, y: ((e.clientY - cy) / cy) * 24 * strength });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [strength]);
  return xy;
}

// Animated count-up triggered when in view
function CountUp({ to, prefix = "", duration = 1600 }: { to: number; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}</span>;
}

const CONNECTORS: { name: string; slug: string; color: string }[] = [
  { name: "Notion", slug: "notion", color: "000000" },
  { name: "Slack", slug: "slack", color: "4A154B" },
  { name: "Gmail", slug: "gmail", color: "EA4335" },
  { name: "Google Drive", slug: "googledrive", color: "4285F4" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "Linear", slug: "linear", color: "5E6AD2" },
  { name: "HubSpot", slug: "hubspot", color: "FF7A59" },
  { name: "Stripe", slug: "stripe", color: "635BFF" },
  { name: "Intercom", slug: "intercom", color: "1F8DED" },
  { name: "Salesforce", slug: "salesforce", color: "00A1E0" },
  { name: "Figma", slug: "figma", color: "F24E1E" },
  { name: "Jira", slug: "jira", color: "0052CC" },
  { name: "Asana", slug: "asana", color: "F06A6A" },
  { name: "Dropbox", slug: "dropbox", color: "0061FF" },
  { name: "Airtable", slug: "airtable", color: "18BFFF" },
  { name: "Zoom", slug: "zoom", color: "0B5CFF" },
  { name: "Snowflake", slug: "snowflake", color: "29B5E8" },
  { name: "Shopify", slug: "shopify", color: "7AB55C" },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beevr — Your company's brain" },
      { name: "description", content: "Beevr connects your docs, chats, CRM and data into one AI brain for your team. Ask questions, uncover insights and automate work — it knows your business." },
      { property: "og:title", content: "Beevr — Your company's brain" },
      { property: "og:description", content: "One AI brain across your whole company. Ask anything, find what you'd normally miss, and let agents act on your behalf." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const orb = useParallax(1);
  return (
    <div className="min-h-screen bg-white text-[oklch(0.15_0_0)]">
      {/* Outer frame */}
      <div className="relative overflow-hidden">
        {/* Inner rounded white card */}
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
          {/* Nav */}
          <header className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7 md:px-10 md:py-8">
            <Link to="/" className="clicky-sm flex items-center gap-2.5">
              <BrandLogo className="h-12 w-12 object-contain transition-transform duration-200 hover:rotate-[-8deg] hover:scale-110" />
              <span className="text-xl font-bold tracking-tight">Beevr</span>
            </Link>
            <nav className="hidden items-center gap-10 text-[15px] font-medium text-[oklch(0.25_0_0)] md:flex">
              <a href="#brain" className="story-link transition-colors hover:text-black">Brain</a>
              <a href="#insights" className="story-link transition-colors hover:text-black">Insights</a>
              <a href="#agents" className="story-link transition-colors hover:text-black">Agents</a>
              <a href="#pricing" className="story-link transition-colors hover:text-black">Pricing</a>
            </nav>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link to="/auth" className="clicky-sm hidden text-[15px] font-medium text-[oklch(0.25_0_0)] hover:text-black sm:inline">
                Sign in
              </Link>
              <Link
                to="/onboarding"
                className="clicky shine rounded-xl bg-[oklch(0.68_0.22_40)] px-4 py-2 text-[13px] font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/30 hover:bg-[oklch(0.62_0.22_40)] hover:shadow-xl hover:shadow-[oklch(0.68_0.22_40)]/50 sm:px-5 sm:py-2.5 sm:text-[15px]"
              >
                Join the waitlist
              </Link>
            </div>
          </header>

          {/* Hero */}
          <section className="px-5 pb-16 pt-8 text-center sm:px-8 sm:pb-20 sm:pt-12 md:px-10">
            <Reveal className="alive mx-auto inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-sm text-[oklch(0.3_0_0)] backdrop-blur">
              <span className="text-[oklch(0.45_0_0)]">Accelerated by</span>
              <img src={foundersIncLogo} alt="Founders, Inc." className="h-4 w-auto object-contain" />
            </Reveal>

            <Reveal delay={1}>
              <h1 className="font-display mx-auto mt-7 max-w-4xl text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] sm:mt-8 sm:text-6xl md:text-[88px]">
                Your company's <span className="font-display-italic font-semibold text-[oklch(0.62_0.22_40)]">brain.</span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-[oklch(0.4_0_0)] sm:mt-6 sm:text-lg">
                Beevr connects your docs, chats, CRM and data into one AI brain for your team. Ask questions, uncover insights and automate the work in between.
              </p>
            </Reveal>

            <Reveal delay={3} className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
              <Link
                to="/onboarding"
                className="clicky shine group inline-flex items-center gap-2 rounded-xl bg-[oklch(0.68_0.22_40)] px-5 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/40 hover:bg-[oklch(0.62_0.22_40)] sm:px-6 sm:py-3.5 sm:text-[15px]"
              >
                <Sparkles className="h-4 w-4" /> Join the waitlist
                <ArrowRight className="nudge-x h-4 w-4" />
              </Link>
              <a
                href="#brain"
                className="clicky rounded-xl border border-black/10 bg-white px-5 py-3 text-[14px] font-semibold text-[oklch(0.15_0_0)] hover:bg-[oklch(0.97_0_0)] sm:px-6 sm:py-3.5 sm:text-[15px]"
              >
                See how it works
              </a>
            </Reveal>

            {/* Trust strip */}
            <Reveal delay={4} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[oklch(0.5_0_0)]">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_140)]" /> Connects to 40+ tools</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_140)]" /> Live in under 10 minutes</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_140)]" /> SOC 2 ready</span>
            </Reveal>

            {/* Connector marquee */}
            <div className="marquee-mask mt-10 overflow-hidden">
              <div className="marquee gap-3">
                {[...CONNECTORS, ...CONNECTORS].map((c, i) => (
                  <span
                    key={i}
                    className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[oklch(0.3_0_0)]"
                  >
                    <img src={`https://cdn.simpleicons.org/${c.slug}/${c.color}`} alt="" className="h-3.5 w-3.5" loading="lazy" />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Tilted dashboard preview */}
            <div className="relative mt-12 sm:mt-16">
              <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-40 rounded-[100%] bg-[oklch(0.68_0.22_40)] opacity-25 blur-[80px] sm:inset-x-20" />
              <Reveal className="relative mx-auto max-w-5xl">
                <div className="mb-4 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-[oklch(0.3_0_0)] shadow-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.55_0.18_140)] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_140)]" />
                    </span>
                    Live product tour — no signup required
                  </span>
                </div>
                <div
                  className="landing-tilt"
                  style={{
                    filter: "drop-shadow(0 30px 50px rgba(20,10,0,0.18)) drop-shadow(0 10px 20px rgba(20,10,0,0.08))",
                  }}
                >
                  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
                    <DashboardPreview />
                  </div>
                </div>
                {/* Reflection */}
                <div
                  aria-hidden
                  className="pointer-events-none mx-auto mt-2 h-16 max-w-4xl opacity-30"
                  style={{
                    background: "linear-gradient(to bottom, oklch(0.68 0.22 40 / 0.18), transparent)",
                    maskImage: "linear-gradient(to bottom, black, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                    filter: "blur(8px)",
                  }}
                />
              </Reveal>
            </div>
          </section>

          {/* Value prop pillars */}
          <section id="brain" className="border-t border-black/5 bg-[oklch(0.985_0.005_85)] px-5 py-20 sm:px-10">
            <Reveal className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[oklch(0.4_0_0)]">
                <Brain className="h-3 w-3 text-[oklch(0.68_0.22_40)]" /> It knows your business
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Ask anything. <span className="font-display-italic">Get answers with sources.</span>
              </h2>
              <p className="mt-4 text-[oklch(0.4_0_0)]">
                Beevr learns from your company's conversations, customers, revenue and workflows — then answers in plain English with the exact emails, deals and docs to back it up.
              </p>
            </Reveal>

            {/* Big connector grid — 40+ tools */}
            <Reveal>
              <div className="mx-auto mt-12 max-w-5xl rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[oklch(0.5_0_0)]">Native connectors</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[oklch(0.45_0_0)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_140)] breathe" />
                    {CONNECTORS.length}+ live
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-9">
                  {CONNECTORS.map((c) => (
                    <div
                      key={c.name}
                      title={c.name}
                      className="alive group flex aspect-square items-center justify-center rounded-xl border border-black/[0.05] bg-[oklch(0.985_0.005_85)] transition-all hover:border-[oklch(0.68_0.22_40)]/40 hover:bg-white hover:-translate-y-0.5"
                    >
                      <img
                        src={`https://cdn.simpleicons.org/${c.slug}/${c.color}`}
                        alt={c.name}
                        loading="lazy"
                        className="h-7 w-7 transition-transform group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] pt-4 text-[11px] text-[oklch(0.5_0_0)]">
                  <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> Permission-aware — people only see what they already could</span>
                  <span className="inline-flex items-center gap-1.5"><Plug className="h-3 w-3" /> Custom connectors built on request</span>
                </div>
              </div>
            </Reveal>

            <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
              {[
                { icon: Search, title: "“Why did churn increase?”", desc: "Beevr ties Stripe cancellations back to the support threads, NPS drops and product changes that caused them." },
                { icon: MessageSquare, title: "“What did we promise this customer?”", desc: "It pulls the email thread, the deal notes and the contract — so nobody re-promises or under-delivers." },
                { icon: Lock, title: "“Which accounts are at risk?”", desc: "It watches usage, sentiment and engagement across your stack and flags the accounts trending the wrong way." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={((i + 1) as 1 | 2 | 3)}>
                  <div className="alive tilt-card group h-full rounded-2xl border border-black/5 bg-white p-6 transition-all hover:border-[oklch(0.68_0.22_40)]/40 hover:-translate-y-0.5">
                    <div className="bobble mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.97_0.05_70)] text-[oklch(0.62_0.22_40)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight transition-colors group-hover:text-[oklch(0.62_0.22_40)]">{f.title}</h3>
                    <p className="mt-2 text-sm text-[oklch(0.4_0_0)]">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Insights */}
          <section id="insights" className="border-t border-black/5 bg-white px-5 py-20 sm:px-10">
            <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
              <Reveal>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[oklch(0.4_0_0)]">
                  <LineChart className="h-3 w-3 text-[oklch(0.68_0.22_40)]" /> Discover what you're missing
                </div>
                <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                  <span className="headline-underline">Notices the patterns</span> your team would miss.
                </h2>
                <p className="mt-4 text-[oklch(0.4_0_0)]">
                  Beevr doesn't just answer questions — it reads across your whole company and proactively surfaces the opportunities, risks and shifts that matter, delivered to Slack or email.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[
                    "Revenue changes you didn't ask about",
                    "Stalled deals before they go cold",
                    "Customer accounts trending toward churn",
                    "Product trends hiding in support tickets",
                    "Team bottlenecks across your tools",
                  ].map((l) => (
                    <li key={l} className="flex items-start gap-2 text-[oklch(0.25_0_0)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.18_140)]" />
                      {l}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onboarding"
                  className="clicky shine group mt-8 inline-flex items-center gap-2 rounded-xl bg-[oklch(0.15_0_0)] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  <Sparkles className="h-4 w-4" /> Join the waitlist <ArrowRight className="nudge-x h-4 w-4" />
                </Link>
              </Reveal>

              <Reveal delay={2}>
                <div className="relative">
                  <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[oklch(0.68_0.22_40)] opacity-15 blur-[60px]" />
                  <div className="tilt-card relative rounded-2xl border border-black/5 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[oklch(0.3_0_0)]">This week · Revenue</div>
                      <span className="rounded-full bg-[oklch(0.96_0.06_140)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.45_0.18_140)]">+12% MoM</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight tabular-nums">
                        <CountUp to={284210} prefix="$" />
                      </span>
                      <span className="text-xs text-[oklch(0.5_0_0)]">MRR</span>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-1">
                      {[40, 55, 48, 62, 70, 68, 82, 78, 90, 86, 95, 100].map((h, i) => (
                        <div
                          key={i}
                          className="bar-grow flex-1 rounded-t bg-[oklch(0.68_0.22_40)]"
                          style={{ height: `${h}%`, opacity: 0.5 + i * 0.04, animationDelay: `${i * 60}ms` }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Mid-market", val: "+28%", color: "oklch(0.55_0.18_140)" },
                        { label: "Enterprise", val: "+2%", color: "oklch(0.6_0.05_85)" },
                        { label: "SMB churn", val: "-2pts", color: "oklch(0.55_0.18_140)" },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-2 text-xs transition-colors hover:bg-[oklch(0.985_0.005_85)]">
                          <span className="text-[oklch(0.3_0_0)]">{r.label}</span>
                          <span className="font-semibold tabular-nums" style={{ color: r.color }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Agents */}
          <section id="agents" className="border-t border-black/5 bg-[oklch(0.985_0.005_85)] px-5 py-20 sm:px-10">
            <Reveal className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[oklch(0.4_0_0)]">
                <Bot className="h-3 w-3 text-[oklch(0.68_0.22_40)]" /> Your brain takes action
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Create AI agents in <span className="headline-underline">plain English.</span>
              </h2>
              <p className="mt-4 text-[oklch(0.4_0_0)]">
                Describe the work in a sentence. Beevr spins up an agent that watches your data, runs on a schedule and ships results back into Slack, email or your tools.
              </p>
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              {[
                { icon: TrendingUp, title: "Weekly revenue summary", desc: "“Send a weekly revenue summary every Monday morning to #revenue.”" },
                { icon: Zap, title: "Stalled deal alerts", desc: "“Alert me when any enterprise deal stalls more than 7 days.”" },
                { icon: MessageSquare, title: "Support routing", desc: "“Route urgent support tickets to on-call and tag the rest by intent.”" },
              ].map((f, i) => (
                <Reveal key={f.title} delay={((i + 1) as 1 | 2 | 3)}>
                  <div className="alive tilt-card group h-full rounded-2xl border border-black/5 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[oklch(0.68_0.22_40)]/40 hover:shadow-lg">
                    <div className="bobble mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.15_0_0)] text-white transition-transform group-hover:scale-110 group-hover:rotate-[-6deg]">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold transition-colors group-hover:text-[oklch(0.62_0.22_40)]">{f.title}</h3>
                    <p className="mt-2 text-sm text-[oklch(0.4_0_0)]">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Trust */}
          <section className="border-t border-black/5 bg-white px-5 py-16 sm:px-10">
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {[
                { icon: Shield, title: "Enterprise-grade", desc: "SOC 2, role-based access, audit logs, regional data residency." },
                { icon: Lock, title: "Your data stays yours", desc: "We never train on your content. Encrypted at rest and in transit." },
                { icon: Zap, title: "Live in 10 minutes", desc: "OAuth into your stack, Beevr indexes in the background — no IT ticket." },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 rounded-2xl border border-black/5 bg-[oklch(0.985_0_0)] p-5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[oklch(0.62_0.22_40)] ring-1 ring-black/5">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-[oklch(0.4_0_0)]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="border-t border-black/5 bg-[oklch(0.985_0.005_85)] px-5 py-20 sm:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[oklch(0.4_0_0)]">
                <Sparkles className="h-3 w-3 text-[oklch(0.68_0.22_40)]" /> Private beta
              </div>
              <h2 className="font-display mt-4 text-5xl font-semibold tracking-[-0.02em]">Custom pricing, <span className="font-display-italic">hand-rolled.</span></h2>
              <p className="mt-3 text-[oklch(0.4_0_0)]">
                Beevr is tailored for each team in our beta. Join the waitlist and we'll put together a plan that fits your stack, volume and goals.
              </p>
              <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[oklch(0.68_0.22_40)] bg-white p-8 text-left shadow-[0_20px_60px_-20px_oklch(0.68_0.22_40_/_0.4)]">
                <div className="text-sm font-medium text-[oklch(0.4_0_0)]">Tailored plan</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">Let's talk</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {["Scoped to your team size", "Connectors built for your stack", "White-glove onboarding", "Direct line to the founders"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[oklch(0.68_0.22_40)]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onboarding"
                  className="clicky shine group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.68_0.22_40)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/30 hover:bg-[oklch(0.62_0.22_40)]"
                >
                  Join the waitlist <ArrowRight className="nudge-x h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="border-t border-black/5 bg-white px-5 py-20 text-center sm:px-10">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Give your team a brain that never forgets.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[oklch(0.4_0_0)]">
              We onboard a small batch of teams every week. Tell us what you're building and we'll get you set up live.
            </p>
            <Link
              to="/onboarding"
              className="clicky shine group mt-8 inline-flex items-center gap-2 rounded-xl bg-[oklch(0.68_0.22_40)] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/40 hover:bg-[oklch(0.62_0.22_40)]"
            >
              <Sparkles className="h-4 w-4" /> Join the waitlist <ArrowRight className="nudge-x h-4 w-4" />
            </Link>
          </section>

          <footer id="contacts" className="relative border-t border-black/5 bg-white py-8 text-center text-xs text-[oklch(0.4_0_0)]">
            © 2026 Beevr Inc. — Your company's brain.
            <div className="absolute bottom-6 right-6">
              <LillyEasterEgg />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

type ViewKey = "files" | "agents" | "brain";

const NAV: { key: ViewKey; label: string; icon: typeof Brain }[] = [
  { key: "files", label: "Files", icon: FileStack },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "brain", label: "Brain", icon: Brain },
];

function useTick(ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return n;
}

function DashboardPreview() {
  const [view, setView] = useState<ViewKey>("files");
  const [cursor, setCursor] = useState<{ x: number; y: number; click: boolean; visible: boolean }>({ x: 0, y: 0, click: false, visible: false });
  const navRefs = useRef<Record<ViewKey, HTMLDivElement | null>>({ files: null, agents: null, brain: null });
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Initialize cursor on the active nav item once mounted
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const target = navRefs.current[view];
      const root = rootRef.current;
      if (target && root) {
        const tr = target.getBoundingClientRect();
        const rr = root.getBoundingClientRect();
        setCursor({
          x: tr.left - rr.left + tr.width / 2,
          y: tr.top - rr.top + tr.height / 2,
          click: false,
          visible: true,
        });
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle views with a moving cursor
  useEffect(() => {
    const order: ViewKey[] = ["files", "agents", "brain"];
    let i = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      i = (i + 1) % order.length;
      const next = order[i];
      const target = navRefs.current[next];
      const root = rootRef.current;
      if (target && root) {
        const tr = target.getBoundingClientRect();
        const rr = root.getBoundingClientRect();
        const x = tr.left - rr.left + tr.width / 2;
        const y = tr.top - rr.top + tr.height / 2;
        setCursor((c) => ({ ...c, x, y, click: false, visible: true }));
        timers.push(setTimeout(() => setCursor((c) => ({ ...c, click: true })), 900));
        timers.push(setTimeout(() => {
          setView(next);
          setCursor((c) => ({ ...c, click: false }));
        }, 1100));
      }
      timers.push(setTimeout(cycle, 8000));
    };
    timers.push(setTimeout(cycle, 7000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div ref={rootRef} className="relative text-[oklch(0.15_0_0)]">
      {/* Browser bar */}
      <div className="flex items-center gap-3 border-b border-black/5 bg-[oklch(0.985_0_0)] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[oklch(0.7_0.2_25)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.85_0.18_85)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.75_0.18_145)]" />
        </div>
        <div className="hidden items-center gap-1 text-[oklch(0.55_0_0)] sm:flex">
          <ArrowRight className="h-3 w-3 -rotate-180" />
          <ArrowRight className="h-3 w-3 opacity-40" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md border border-black/5 bg-white px-3 py-1 text-xs text-[oklch(0.4_0_0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-500">
          <Lock className="h-2.5 w-2.5 text-[oklch(0.55_0.18_140)]" />
          <span className="text-[oklch(0.5_0_0)]">app.beevr.dev</span>
          <span className="text-[oklch(0.7_0_0)]">/</span>
          <span key={view} className="font-medium text-[oklch(0.2_0_0)] animate-fade-in">{view}</span>
        </div>
        <div className="hidden items-center gap-1.5 text-[10px] text-[oklch(0.5_0_0)] sm:flex">
          {NAV.map((n) => (
            <span
              key={n.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${view === n.key ? "w-5 bg-[oklch(0.68_0.22_40)]" : "w-1.5 bg-[oklch(0.85_0_0)]"}`}
              title={n.label}
            />
          ))}
        </div>
      </div>


      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-black/5 p-4 text-xs">
          <div className="mb-6 flex items-center gap-2 font-bold">
            <BrandLogo className="h-8 w-8 object-contain" />
            Beevr
          </div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[oklch(0.5_0_0)]">Main</div>
          <div className="space-y-1">
            {NAV.map((n) => {
              const active = view === n.key;
              return (
                <div
                  key={n.key}
                  ref={(el) => { navRefs.current[n.key] = el; }}
                  className={`demo-nav-item flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                    active
                      ? "is-active bg-[oklch(0.97_0.05_70)] font-medium text-[oklch(0.62_0.22_40)]"
                      : "text-[oklch(0.4_0_0)]"
                  }`}
                >
                  <n.icon className="demo-nav-icon h-3.5 w-3.5" />
                  {n.label}
                </div>
              );
            })}
            <div className="px-2 py-1.5 text-[oklch(0.4_0_0)]">Team Spaces</div>
            <div className="px-2 py-1.5 text-[oklch(0.4_0_0)]">Docs</div>
          </div>
          <div className="mt-6 mb-2 text-[10px] font-medium uppercase tracking-wider text-[oklch(0.5_0_0)]">Other</div>
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-[oklch(0.4_0_0)]">Settings</div>
            <div className="px-2 py-1.5 text-[oklch(0.4_0_0)]">Get Help</div>
          </div>
        </div>

        {/* Content — animated swap */}
        <div className="relative flex-1 overflow-hidden">
          <div key={view} className="view-enter p-5">
            {view === "files" && <FilesView />}
            {view === "agents" && <AgentsView />}
            {view === "brain" && <BrainView />}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-black/5 bg-[oklch(0.985_0_0)] px-4 py-1.5 text-[10px] text-[oklch(0.5_0_0)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.55_0.18_140)]" />
            All systems operational
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">5 connectors synced</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Viewing</span>
          <span className="rounded bg-white px-1.5 py-0.5 font-medium text-[oklch(0.2_0_0)] ring-1 ring-black/5">{view}</span>
        </div>
      </div>


      {/* Faux cursor */}
      <div
        className="pointer-events-none absolute z-20"
        style={{
          left: cursor.x,
          top: cursor.y,
          opacity: cursor.visible ? 1 : 0,
          transition: "left 900ms cubic-bezier(0.65, 0, 0.35, 1), top 900ms cubic-bezier(0.65, 0, 0.35, 1), opacity 400ms ease",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className={`demo-cursor ${cursor.click ? "is-clicking" : ""}`}
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
        >
          <path d="M3 2 L3 17 L8 13 L11 20 L14 19 L11 12 L18 12 Z" fill="#111" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        {cursor.click && (
          <span className="absolute -left-2 -top-2 h-7 w-7 animate-ping rounded-full bg-[oklch(0.68_0.22_40)] opacity-50" />
        )}
      </div>
    </div>
  );
}

// === FILES VIEW: drag-drop + processing pipeline ===
function FilesView() {
  const tick = useTick(900);
  const phase = tick % 12; // 0–3 hover, 4 dropped, 5–8 uploading, 9–11 processed
  const dropped = phase >= 4;
  const uploading = phase >= 5 && phase <= 8;
  const done = phase >= 9;
  const progress = uploading ? Math.min(100, (phase - 4) * 28) : done ? 100 : 0;

  const existing = [
    { name: "Q3-roadmap.pdf", size: "1.4 MB", chunks: 184, src: "Notion" },
    { name: "pricing-deck.pptx", size: "3.2 MB", chunks: 312, src: "Drive" },
    { name: "support-faqs.md", size: "42 KB", chunks: 58, src: "GitHub" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Upload knowledge</h4>
          <span className="text-[10px] text-[oklch(0.4_0_0)]">PDF · DOCX · MD · CSV</span>
        </div>
        <div className={`relative grid h-40 place-items-center rounded-xl border-2 border-dashed transition-all duration-300 ${
          dropped ? "border-[oklch(0.68_0.22_40)] bg-[oklch(0.97_0.05_70)]" : "border-black/10 bg-[oklch(0.98_0_0)]"
        }`}>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className={`grid h-10 w-10 place-items-center rounded-xl transition-all ${dropped ? "bg-[oklch(0.68_0.22_40)] text-white scale-110" : "bg-white text-[oklch(0.4_0_0)] border border-black/10"}`}>
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold">{dropped ? "contract.pdf" : "Drop a file or click to browse"}</div>
            <div className="text-[10px] text-[oklch(0.4_0_0)]">{dropped ? "812 KB" : "Up to 50 MB per file"}</div>
          </div>

          {/* Floating file icon that drops in */}
          <div
            className="pointer-events-none absolute transition-all duration-700 ease-out"
            style={{
              top: dropped ? "50%" : "10%",
              right: dropped ? "50%" : "10%",
              transform: dropped ? "translate(50%, -120%) scale(0.6)" : "translate(0,0) scale(1)",
              opacity: dropped ? 0 : 1,
            }}
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[10px] shadow-md">
              <FileText className="h-3.5 w-3.5 text-[oklch(0.6_0.2_25)]" /> contract.pdf
            </div>
          </div>
        </div>

        {(uploading || done) && (
          <div className="mt-3 rounded-lg border border-black/5 bg-[oklch(0.98_0_0)] p-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-4 w-4 text-[oklch(0.6_0.2_25)]" />
              <span className="flex-1 truncate font-medium">contract.pdf</span>
              <span className="tabular-nums text-[10px] text-[oklch(0.4_0_0)]">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-[oklch(0.68_0.22_40)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[oklch(0.4_0_0)]">
              {done ? (
                <><Check className="h-3 w-3 text-[oklch(0.55_0.18_140)]" /> Indexed · 142 chunks · ready to query</>
              ) : (
                <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.68_0.22_40)]" /> Extracting text · embedding chunks…</>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Recent files</h4>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.68_0.22_40)]" />
        </div>
        <ul className="space-y-2">
          {done && (
            <li className="flex items-center gap-2 rounded-lg border border-[oklch(0.68_0.22_40)]/30 bg-[oklch(0.97_0.05_70)] p-2 animate-fade-in">
              <FileText className="h-4 w-4 text-[oklch(0.6_0.2_25)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">contract.pdf</div>
                <div className="text-[10px] text-[oklch(0.4_0_0)]">812 KB · 142 chunks</div>
              </div>
              <span className="rounded bg-white px-1.5 py-0.5 text-[9px] text-[oklch(0.55_0.18_140)]">New</span>
            </li>
          )}
          {existing.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg border border-black/5 p-2">
              <FileText className="h-4 w-4 text-[oklch(0.5_0_0)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{f.name}</div>
                <div className="text-[10px] text-[oklch(0.4_0_0)]">{f.size} · {f.chunks} chunks</div>
              </div>
              <span className="text-[9px] text-[oklch(0.4_0_0)]">{f.src}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// === AGENTS VIEW: chat-to-build an agent ===
function AgentsView() {
  const tick = useTick(280);
  const cycle = tick;
  const fullPrompt = "Create an agent that summarizes Stripe revenue every Monday at 9am and posts it to #revenue in Slack.";
  const typedLen = Math.min(fullPrompt.length, cycle * 10);
  const typed = fullPrompt.slice(0, typedLen);
  const sent = typedLen >= fullPrompt.length;
  const replyLines = [
    "Got it — I'll spin up an agent for that:",
    "  · trigger: every Mon · 9:00 AM",
    "  · query Stripe → invoices.list (last 7d)",
    "  · summarize by segment + delta vs prior week",
    "  · post → slack.#revenue",
    "Ready to deploy?",
  ];
  const replyStart = Math.ceil(fullPrompt.length / 10) + 1;
  const visibleReply = sent ? replyLines.slice(0, Math.max(0, Math.min(replyLines.length, cycle - replyStart))) : [];
  const created = sent && cycle - replyStart > replyLines.length + 1;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Chat side */}
      <div className="col-span-2 flex h-[320px] flex-col rounded-xl border border-black/5 bg-white">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-[oklch(0.68_0.22_40)] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-semibold">Build an agent</div>
          </div>
          <span className="text-[10px] text-[oklch(0.4_0_0)]">Beevr · gpt-5</span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-hidden p-4 text-xs">
          {sent && (
            <div className="flex justify-end animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[oklch(0.97_0_0)] px-3 py-2 text-[oklch(0.2_0_0)]">
                {fullPrompt}
              </div>
            </div>
          )}
          {sent && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[oklch(0.68_0.22_40)] text-white">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5 font-mono text-[11px] leading-relaxed text-[oklch(0.2_0_0)]">
                {visibleReply.map((l, i) => (
                  <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>{l}</div>
                ))}
                {visibleReply.length > 0 && visibleReply.length < replyLines.length && (
                  <span className="inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.68_0.22_40)]" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
            <Paperclip className="h-3.5 w-3.5 text-[oklch(0.5_0_0)]" />
            <div className="min-w-0 flex-1 text-xs text-[oklch(0.2_0_0)]">
              {sent ? <span className="text-[oklch(0.5_0_0)]">Ask a follow-up…</span> : (
                <>
                  {typed}
                  <span className="inline-block h-3 w-[2px] -mb-0.5 animate-pulse bg-[oklch(0.2_0_0)] align-middle" />
                </>
              )}
            </div>
            <button className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${typedLen > 0 ? "bg-[oklch(0.68_0.22_40)] text-white" : "bg-[oklch(0.95_0_0)] text-[oklch(0.6_0_0)]"}`}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Agent preview */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 text-xs font-semibold">Workspace agents</div>
        <div className="space-y-2">
          {created && (
            <div className="rounded-lg border-2 border-[oklch(0.68_0.22_40)]/40 bg-[oklch(0.97_0.05_70)] p-3 animate-fade-in shadow-[0_0_0_3px_color-mix(in_oklab,oklch(0.68_0.22_40)_10%,transparent)]">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[oklch(0.68_0.22_40)] text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">Revenue Digest</div>
                  <div className="text-[10px] text-[oklch(0.4_0_0)]">Mon 9:00 · Stripe → Slack</div>
                </div>
                <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-medium text-[oklch(0.55_0.18_140)]">New</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[oklch(0.4_0_0)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.68_0.22_40)]" /> Deploying…
              </div>
            </div>
          )}
          <AgentRow name="Hiring Pipeline" sub="Daily · Greenhouse → Notion" running />
          <AgentRow name="Support Triage" sub="Realtime · Intercom" />
        </div>
      </div>
    </div>
  );
}

function AgentRow({ name, sub, running }: { name: string; sub: string; running?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-black/5 p-3">
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[oklch(0.97_0_0)]">
        <Bot className="h-3.5 w-3.5 text-[oklch(0.4_0_0)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold">{name}</div>
        <div className="text-[10px] text-[oklch(0.4_0_0)]">{sub}</div>
      </div>
      <span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-[oklch(0.68_0.22_40)]" : "bg-[oklch(0.85_0_0)]"}`} />
    </div>
  );
}

// === BRAIN VIEW: ask-anything chat with sources ===
function BrainView() {
  const tick = useTick(260);
  const cycle = tick;
  const question = "What's our MRR this month and which segment is growing fastest?";
  const typedLen = Math.min(question.length, cycle * 10);
  const typed = question.slice(0, typedLen);
  const sent = typedLen >= question.length;
  const answerWords = "MRR is $284k, up 12% MoM. The Mid-market segment is leading growth at +28% — driven by 14 new SaaS customers. Enterprise is flat; SMB churn is down 2pts.".split(" ");
  const answerStart = Math.ceil(question.length / 10) + 1;
  const shownWords = sent ? answerWords.slice(0, Math.max(0, Math.min(answerWords.length, (cycle - answerStart) * 4))) : [];
  const sources = [
    { name: "Stripe · Invoices", icon: Send, color: "oklch(0.55_0.2_270)" },
    { name: "Hubspot · Deals", icon: Mail, color: "oklch(0.6_0.2_25)" },
    { name: "Q3 Board Doc", icon: FileText, color: "oklch(0.5_0_0)" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 flex h-[320px] flex-col rounded-xl border border-black/5 bg-white">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-[oklch(0.15_0_0)] text-white">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-semibold">Ask your business</div>
          </div>
          <span className="text-[10px] text-[oklch(0.4_0_0)]">5 sources connected</span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-hidden p-4 text-xs">
          {sent && (
            <div className="flex items-start justify-end gap-2 animate-fade-in">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[oklch(0.97_0_0)] px-3 py-2">{question}</div>
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[oklch(0.65_0.2_40)] text-[10px] font-semibold text-white">A</div>
            </div>
          )}
          {sent && shownWords.length > 0 && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[oklch(0.15_0_0)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[85%] leading-relaxed">
                {shownWords.join(" ")}
                {shownWords.length < answerWords.length && (
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-[oklch(0.15_0_0)] align-middle" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
            <MessageSquare className="h-3.5 w-3.5 text-[oklch(0.5_0_0)]" />
            <div className="min-w-0 flex-1 text-xs">
              {sent ? <span className="text-[oklch(0.5_0_0)]">Ask a follow-up…</span> : (
                <>
                  {typed}
                  <span className="inline-block h-3 w-[2px] -mb-0.5 animate-pulse bg-[oklch(0.2_0_0)] align-middle" />
                </>
              )}
            </div>
            <button className={`grid h-7 w-7 place-items-center rounded-lg ${typedLen > 0 ? "bg-[oklch(0.15_0_0)] text-white" : "bg-[oklch(0.95_0_0)] text-[oklch(0.6_0_0)]"}`}>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold">Sources</h4>
          <span className="text-[10px] text-[oklch(0.4_0_0)]">{sent ? "3 used" : "—"}</span>
        </div>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center gap-2 rounded-lg border p-2 transition-all duration-300 ${
                sent && shownWords.length > i * 4
                  ? "border-[oklch(0.68_0.22_40)]/30 bg-[oklch(0.97_0.05_70)]"
                  : "border-black/5 opacity-60"
              }`}
            >
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[oklch(0.97_0_0)]">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{s.name}</div>
                <div className="text-[10px] text-[oklch(0.4_0_0)]">cited · 2 chunks</div>
              </div>
              {sent && shownWords.length > i * 4 && (
                <Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_140)]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
