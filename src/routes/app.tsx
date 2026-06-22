import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Brain, Users, FileStack, Bot, ShieldCheck, Plug, KeyRound, LogOut, Cloud, Settings, Menu, X, ChevronUp, PanelLeftClose, PanelLeft, Shield, Server, Code2, ChevronDown, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LiveFeed } from "@/components/live-feed";
import { useAuth } from "@/hooks/use-auth";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { GlobalUploader } from "@/components/global-uploader";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const navItems = [
  { label: "Home", to: "/app/brain" as const, icon: Brain },
  { label: "Agents", to: "/app/agents" as const, icon: Bot },
  { label: "Build", to: "/app/build" as const, icon: Cloud },
  { label: "Workspace", to: "/app/team" as const, icon: Users },
  { label: "Files", to: "/app/files" as const, icon: FileStack },
  { label: "Connections", to: "/app/connections" as const, icon: Plug },
  { label: "Admin", to: "/app/admin" as const, icon: Shield },
];

const developerItems = [
  { label: "APIs", to: "/app/apis" as const, icon: Server },
  { label: "Access Keys", to: "/app/keys" as const, icon: KeyRound },
  { label: "MCP", to: "/app/mcp" as const, icon: Network },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavigating = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { current: workspace } = useWorkspaces();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("beevr-developer-open") === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("beevr-developer-open", developerOpen ? "1" : "0");
    }
  }, [developerOpen]);
  const developerActive = developerItems.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
  useEffect(() => {
    if (developerActive) setDeveloperOpen(true);
  }, [developerActive]);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("beevr-sidebar-collapsed") === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("beevr-sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Flush any waitlist draft saved before OAuth redirect
  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem("beevr-waitlist-draft");
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, string>;
      sessionStorage.removeItem("beevr-waitlist-draft");
      void supabase.from("waitlist_submissions").insert({
        user_id: user.id,
        email: user.email ?? "",
        full_name: d.name || (user.user_metadata?.display_name as string) || null,
        business: d.business || null,
        goal: d.goal || null,
        phone: d.phone || null,
        linkedin: d.linkedin || null,
        referral_source: d.referral || null,
      });
    } catch {}
  }, [user]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.04_0_0)] text-sm text-white/70">
        Loading…
      </div>
    );
  }

  const ADMIN_EMAILS = ["aalang@ucsc.edu", "vansh.chhabra343@gmail.com"];
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");
  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[oklch(0.04_0_0)] p-3 text-white">
        <div className="pointer-events-none absolute -left-32 top-20 h-[500px] w-[400px] rounded-full bg-[oklch(0.72_0.21_45)] opacity-50 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-60 h-[500px] w-[400px] rounded-full bg-[oklch(0.72_0.21_45)] opacity-50 blur-[120px]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-xl items-center justify-center">
          <div className="w-full rounded-[28px] bg-white p-10 text-center text-[oklch(0.15_0_0)] ring-1 ring-black/5">
            <BrandLogo className="mx-auto mb-5 h-14 w-14 object-contain" />
            <h1 className="text-3xl font-bold tracking-tight">You're on the list 🐝</h1>
            <p className="mt-3 text-[oklch(0.4_0_0)]">
              Beevr is still in private beta. We've saved your application and we'll reach out personally as soon as a spot opens for {user.email}.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/" className="clicky rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[oklch(0.25_0_0)] hover:bg-[oklch(0.97_0_0)]">Back home</Link>
              <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="clicky rounded-xl bg-[oklch(0.68_0.22_40)] px-5 py-3 text-sm font-semibold text-white hover:bg-[oklch(0.62_0.22_40)]">Sign out</button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const displayName = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "You";
  const initial = displayName.charAt(0).toUpperCase();

  const renderSidebar = (mini: boolean) => (
    <>
      <Link to="/" className={`mb-4 flex items-center gap-2.5 ${mini ? "justify-center" : ""}`}>
        <BrandLogo className="h-10 w-10 shrink-0 object-contain" />
        {!mini && <span className="text-xl font-bold tracking-tight">Beevr</span>}
      </Link>
      {!mini && (
        <div className="mb-5">
          <WorkspaceSwitcher />
        </div>
      )}
      {mini && (
        <div
          className="mx-auto mb-5 h-2.5 w-2.5 rounded-full"
          style={{ background: workspace.color }}
          title={workspace.name}
        />
      )}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={mini ? item.label : undefined}
              className={`clicky-sm flex w-full items-center rounded-xl text-sm transition-all duration-100 ${
                mini ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-[oklch(0.15_0_0)] text-white font-semibold"
                  : "text-[oklch(0.3_0_0)] hover:bg-black/[0.04]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!mini && item.label}
            </Link>
          );
        })}

        {mini ? (
          <div className="mt-1 space-y-1 border-t border-black/5 pt-2">
            {developerItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`clicky-sm flex w-full items-center justify-center rounded-xl p-2.5 text-sm transition-all duration-100 ${
                    active
                      ? "bg-[oklch(0.15_0_0)] text-white font-semibold"
                      : "text-[oklch(0.3_0_0)] hover:bg-black/[0.04]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-1">
            <button
              onClick={() => setDeveloperOpen((o) => !o)}
              className={`clicky-sm flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-100 ${
                developerActive
                  ? "text-[oklch(0.15_0_0)] font-semibold"
                  : "text-[oklch(0.3_0_0)] hover:bg-black/[0.04]"
              }`}
              aria-expanded={developerOpen}
            >
              <Code2 className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Developer</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[oklch(0.45_0_0)] transition-transform ${developerOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
            {developerOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l border-black/5 pl-3">
                {developerItems.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`clicky-sm flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-100 ${
                        active
                          ? "bg-[oklch(0.15_0_0)] text-white font-semibold"
                          : "text-[oklch(0.35_0_0)] hover:bg-black/[0.04]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`clicky mt-auto flex w-full items-center rounded-2xl border border-black/5 bg-white/60 text-left backdrop-blur transition-colors hover:bg-white/80 ${
              mini ? "justify-center p-2" : "gap-2.5 p-3"
            }`}
            title={mini ? displayName : undefined}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[oklch(0.65_0.2_40)] text-sm font-semibold text-white">
              {initial}
            </div>
            {!mini && (
              <>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="truncate font-semibold">{displayName}</div>
                  <div className="truncate text-[oklch(0.45_0_0)]">{user.email}</div>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-[oklch(0.45_0_0)]" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-xs font-semibold">{displayName}</div>
            <div className="truncate text-[10px] font-normal text-muted-foreground">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate({ to: "/app/settings" })}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate({ to: "/app/approvals" })}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Approvals
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-[oklch(0.96_0_0)] p-0 text-foreground md:p-3">
      <div className="relative mx-auto flex h-full max-w-[1500px] overflow-hidden bg-white ring-1 ring-black/5 md:rounded-[24px]">
        <aside
          className={`hidden shrink-0 flex-col border-r border-black/5 bg-white p-3 transition-[width] duration-200 ease-out md:flex ${
            collapsed ? "w-[68px]" : "w-60 p-5"
          }`}
        >
          {renderSidebar(collapsed)}
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />
            <aside
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-5 shadow-2xl animate-[slideInLeft_200ms_ease-out]"
            >
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[oklch(0.4_0_0)] hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
              {renderSidebar(false)}
            </aside>
          </div>
        )}

        <main className="relative flex flex-1 flex-col overflow-hidden bg-white">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${isNavigating ? "opacity-100" : "opacity-0"}`}
          >
            <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-[oklch(0.68_0.22_40)]" />
          </div>
          <div className="flex items-center gap-2 border-b border-black/5 bg-white px-3 py-3 md:px-6">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="clicky-sm -ml-1 rounded-lg p-1.5 text-[oklch(0.3_0_0)] hover:bg-black/5 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="clicky-sm hidden -ml-1 rounded-lg p-1.5 text-[oklch(0.4_0_0)] hover:bg-black/5 md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <div className="hidden gap-1.5 md:flex">
              <span className="h-3 w-3 rounded-full bg-[oklch(0.62_0.22_25)]" />
              <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_70)]" />
              <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.18_145)]" />
            </div>
            <div className="mx-auto flex min-w-0 items-center gap-2 rounded-md border border-black/5 bg-white px-3 py-1 text-xs text-[oklch(0.4_0_0)] md:px-4">
              <span className="breathe h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: workspace.color }} />
              <span className="truncate font-medium text-[oklch(0.25_0_0)]">{workspace.name.toLowerCase().replace(/\s+/g, "-")}</span>
              <span className="hidden truncate text-[oklch(0.55_0_0)] sm:inline">.beevr.dev{pathname.replace(/^\/app/, "") || "/home"}</span>
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div key={pathname} className="flex min-h-0 flex-1 flex-col overflow-hidden animate-[fadeInUp_80ms_ease-out]">
              <Outlet />
            </div>
            <LiveFeed />
          </div>
        </main>
      </div>
      <GlobalUploader />
    </div>
  );
}
