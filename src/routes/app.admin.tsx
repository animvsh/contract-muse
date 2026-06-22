import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  Sparkles,
  Loader2,
  Search,
  Users,
  TrendingUp,
  Calendar,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  Copy,
  Check,
  ArrowUpDown,
  X as XIcon,
  StickyNote,
  Filter,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const ADMIN_EMAILS = ["aalang@ucsc.edu", "vansh.chhabra343@gmail.com"];
const isAdminEmail = (email?: string | null) => ADMIN_EMAILS.includes(email?.toLowerCase() ?? "");
const STAR_KEY = "beevr.admin.starred";
const DONE_KEY = "beevr.admin.contacted";
const NOTES_KEY = "beevr.admin.notes";

type Submission = {
  id: string;
  email: string;
  full_name: string | null;
  business: string | null;
  goal: string | null;
  phone: string | null;
  linkedin: string | null;
  referral_source: string | null;
  created_at: string;
  deleted_at: string | null;
};

type SortKey = "newest" | "oldest" | "name" | "starred";
type FilterKey = "all" | "starred" | "contacted" | "uncontacted" | "with_business" | "deleted";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — Waitlist" }] }),
  component: AdminPage,
});

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify([...set]));
}
function loadNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveNotes(n: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(n));
}

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Submission[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortKey>("newest");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setStarred(loadSet(STAR_KEY));
    setContacted(loadSet(DONE_KEY));
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    if (!loading && (!user || !isAdminEmail(user.email))) {
      navigate({ to: "/app" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !isAdminEmail(user.email)) return;
    (async () => {
      setBusy(true);
      const { data, error } = await supabase
        .from("waitlist_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as Submission[]);
      setBusy(false);
    })();
  }, [user]);

  const toggleStar = (id: string) =>
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSet(STAR_KEY, next);
      return next;
    });
  const toggleContacted = (id: string) =>
    setContacted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSet(DONE_KEY, next);
      return next;
    });
  const updateNote = (id: string, value: string) =>
    setNotes((prev) => {
      const next = { ...prev, [id]: value };
      if (!value) delete next[id];
      saveNotes(next);
      return next;
    });

  const softDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, deleted_at: new Date().toISOString() } : x)));
    const { error } = await supabase
      .from("waitlist_submissions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setRows(prev);
      alert("Couldn't delete: " + error.message);
    }
  };
  const restore = async (id: string) => {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, deleted_at: null } : x)));
    const { error } = await supabase
      .from("waitlist_submissions")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) {
      setRows(prev);
      alert("Couldn't restore: " + error.message);
    }
  };

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      const isDeleted = Boolean(r.deleted_at);
      if (filter === "deleted") {
        if (!isDeleted) return false;
      } else if (isDeleted) {
        return false;
      }
      if (filter === "starred" && !starred.has(r.id)) return false;
      if (filter === "contacted" && !contacted.has(r.id)) return false;
      if (filter === "uncontacted" && contacted.has(r.id)) return false;
      if (filter === "with_business" && !r.business) return false;
      if (!q) return true;
      const hay = [r.email, r.full_name, r.business, r.goal, r.phone, r.linkedin, r.referral_source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    if (sort === "oldest") list = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === "name") list = [...list].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
    else if (sort === "starred") list = [...list].sort((a, b) => (starred.has(b.id) ? 1 : 0) - (starred.has(a.id) ? 1 : 0));
    return list;
  }, [rows, q, filter, sort, starred, contacted]);

  const stats = useMemo(() => {
    const live = rows.filter((r) => !r.deleted_at);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last7 = live.filter((r) => now - new Date(r.created_at).getTime() < 7 * day).length;
    const last24 = live.filter((r) => now - new Date(r.created_at).getTime() < day).length;
    const deleted = rows.length - live.length;
    return { total: live.length, last7, last24, starred: starred.size, contacted: contacted.size, deleted };
  }, [rows, starred, contacted]);

  const exportCsv = () => {
    const headers = ["Created", "Name", "Email", "Business", "Goal", "Phone", "LinkedIn", "Referral", "Starred", "Contacted"];
    const escape = (v: string | null | boolean) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          new Date(r.created_at).toISOString(),
          r.full_name,
          r.email,
          r.business,
          r.goal,
          r.phone,
          r.linkedin,
          r.referral_source,
          starred.has(r.id),
          contacted.has(r.id),
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedIdx = selected ? filtered.findIndex((r) => r.id === selected.id) : -1;
  const goPrev = () => selectedIdx > 0 && setSelected(filtered[selectedIdx - 1]);
  const goNext = () => selectedIdx >= 0 && selectedIdx < filtered.length - 1 && setSelected(filtered[selectedIdx + 1]);

  return (
    <div className="mx-auto h-full w-full max-w-6xl overflow-y-auto px-3 py-5 sm:px-4 sm:py-8 md:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.68_0.22_40)]/20 bg-[oklch(0.68_0.22_40)]/10 px-3 py-1 text-xs font-semibold text-[oklch(0.55_0.22_40)]">
            <Shield className="h-3 w-3" /> Admin
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[oklch(0.18_0_0)] sm:text-3xl">Waitlist applicants</h1>
          <p className="mt-1 text-sm text-[oklch(0.45_0_0)]">
            Triage applicants. Star, mark as contacted, take notes and export.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="clicky ripple inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[oklch(0.2_0_0)] hover:bg-[oklch(0.97_0_0)] disabled:opacity-50 sm:w-auto"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3 md:grid-cols-6">
        <StatCard icon={Users} label="Total" value={stats.total} accent="oklch(0.68 0.22 40)" />
        <StatCard icon={TrendingUp} label="Last 7d" value={stats.last7} accent="oklch(0.7 0.16 145)" />
        <StatCard icon={Calendar} label="Last 24h" value={stats.last24} accent="oklch(0.68 0.18 250)" />
        <StatCard icon={Star} label="Starred" value={stats.starred} accent="oklch(0.74 0.16 85)" />
        <StatCard icon={CheckCircle2} label="Contacted" value={stats.contacted} accent="oklch(0.6 0.14 160)" />
        <StatCard icon={Trash2} label="Deleted" value={stats.deleted} accent="oklch(0.58 0.18 25)" />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.5_0_0)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applicants…"
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm text-[oklch(0.2_0_0)] outline-none placeholder:text-[oklch(0.55_0_0)] focus:border-[oklch(0.68_0.22_40)]/40"
          />
        </div>
        <div className="relative hidden items-center sm:inline-flex">
          <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[oklch(0.5_0_0)]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-[oklch(0.2_0_0)] outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="starred">Starred first</option>
          </select>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`clicky-sm inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium sm:hidden ${
            filtersOpen || filter !== "all"
              ? "border-[oklch(0.68_0.22_40)]/40 bg-[oklch(0.68_0.22_40)]/10 text-[oklch(0.55_0.22_40)]"
              : "border-black/10 bg-white text-[oklch(0.35_0_0)]"
          }`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className={`mb-4 ${filtersOpen ? "block" : "hidden sm:block"}`}>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["all", "All"],
            ["starred", "Starred"],
            ["uncontacted", "Uncontacted"],
            ["contacted", "Contacted"],
            ["with_business", "Has business"],
            ["deleted", `Deleted${stats.deleted ? ` (${stats.deleted})` : ""}`],
          ] as [FilterKey, string][]).map(([k, l]) => {
            const isDel = k === "deleted";
            const active = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`clicky-sm inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? isDel
                      ? "bg-[oklch(0.58_0.18_25)] text-white"
                      : "bg-[oklch(0.68_0.22_40)] text-white"
                    : isDel
                    ? "border border-[oklch(0.58_0.18_25)]/30 bg-[oklch(0.58_0.18_25)]/8 text-[oklch(0.5_0.18_25)] hover:bg-[oklch(0.58_0.18_25)]/15"
                    : "border border-black/10 bg-white text-[oklch(0.35_0_0)] hover:bg-[oklch(0.96_0_0)]"
                }`}
              >
                {isDel && <Trash2 className="h-3 w-3" />}
                {l}
              </button>
            );
          })}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0_0)] outline-none sm:hidden"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
            <option value="starred">Starred</option>
          </select>
        </div>
      </div>

      {busy ? (
        <div className="flex items-center gap-2 text-sm text-[oklch(0.45_0_0)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading applicants…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-8 text-center text-sm text-[oklch(0.45_0_0)] sm:p-12">
          {rows.length === 0 ? "No waitlist signups yet." : "No matches."}
        </div>
      ) : (
        <div className="grid gap-2 pb-6">
          {filtered.map((r) => (
            <Row
              key={r.id}
              r={r}
              starred={starred.has(r.id)}
              contacted={contacted.has(r.id)}
              hasNote={Boolean(notes[r.id])}
              onOpen={() => setSelected(r)}
              onStar={() => toggleStar(r.id)}
              onContacted={() => toggleContacted(r.id)}
              onDelete={() => {
                if (confirm(`Remove ${r.full_name || r.email} from the waitlist? You can restore from the Deleted filter.`)) {
                  softDelete(r.id);
                }
              }}
              onRestore={() => restore(r.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailDrawer
          s={selected}
          starred={starred.has(selected.id)}
          contacted={contacted.has(selected.id)}
          note={notes[selected.id] || ""}
          onStar={() => toggleStar(selected.id)}
          onContacted={() => toggleContacted(selected.id)}
          onNoteChange={(v) => updateNote(selected.id, v)}
          onClose={() => setSelected(null)}
          onPrev={selectedIdx > 0 ? goPrev : undefined}
          onNext={selectedIdx < filtered.length - 1 ? goNext : undefined}
          position={selectedIdx + 1}
          total={filtered.length}
          onDelete={() => {
            if (confirm(`Remove ${selected.full_name || selected.email} from the waitlist?`)) {
              softDelete(selected.id);
              setSelected(null);
            }
          }}
          onRestore={() => {
            restore(selected.id);
          }}
        />
      )}
    </div>
  );
}

function Row({
  r,
  starred,
  contacted,
  hasNote,
  onOpen,
  onStar,
  onContacted,
  onDelete,
  onRestore,
}: {
  r: Submission;
  starred: boolean;
  contacted: boolean;
  hasNote: boolean;
  onOpen: () => void;
  onStar: () => void;
  onContacted: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isDeleted = Boolean(r.deleted_at);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(r.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div
      onClick={onOpen}
      role="button"
      className={`clicky group relative flex w-full items-center gap-2.5 rounded-2xl border bg-white p-3 text-left transition hover:border-[oklch(0.68_0.22_40)]/30 sm:gap-3 sm:p-3.5 ${
        isDeleted
          ? "border-[oklch(0.58_0.18_25)]/25 bg-[oklch(0.98_0.02_25)]/60"
          : contacted
          ? "border-[oklch(0.6_0.14_160)]/30 bg-[oklch(0.97_0.04_160)]/40"
          : "border-black/5"
      }`}
    >
      {isDeleted && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-[oklch(0.58_0.18_25)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[oklch(0.5_0.18_25)] sm:left-auto sm:right-3">
          <Trash2 className="h-2.5 w-2.5" /> Deleted
        </span>
      )}
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white sm:h-11 sm:w-11 ${isDeleted ? "bg-[oklch(0.58_0.18_25)]/70" : "bg-[oklch(0.68_0.22_40)]"}`}>
        {(r.full_name?.[0] || r.email[0]).toUpperCase()}
      </div>
      <div className={`min-w-0 flex-1 ${isDeleted ? "opacity-75" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`truncate font-semibold text-[oklch(0.18_0_0)] ${isDeleted ? "line-through decoration-[oklch(0.58_0.18_25)]/50" : ""}`}>
            {r.full_name || r.email.split("@")[0]}
          </div>
          {r.business && !isDeleted && (
            <span className="hidden shrink-0 rounded-md bg-[oklch(0.97_0.02_85)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.45_0.05_60)] md:inline">
              {r.business.slice(0, 24)}{r.business.length > 24 ? "…" : ""}
            </span>
          )}
          {contacted && !isDeleted && (
            <span className="hidden items-center gap-1 rounded-md bg-[oklch(0.6_0.14_160)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[oklch(0.4_0.14_160)] sm:inline-flex">
              <CheckCircle2 className="h-2.5 w-2.5" /> Contacted
            </span>
          )}
          {hasNote && (
            <span title="Has note" className="inline-flex shrink-0 items-center text-[oklch(0.6_0.14_250)]">
              <StickyNote className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[oklch(0.45_0_0)]">
          <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{r.email}</span>
          {isDeleted && r.deleted_at && (
            <span className="ml-1 hidden text-[10px] text-[oklch(0.5_0.18_25)] sm:inline">
              · removed {new Date(r.deleted_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-0.5 text-[11px] text-[oklch(0.5_0_0)] md:flex">
        <span>{new Date(r.created_at).toLocaleDateString()}</span>
        <span className="text-[10px]">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {isDeleted ? (
          <IconBtn onClick={stop(onRestore)} title="Restore">
            <RotateCcw className="h-3.5 w-3.5 text-[oklch(0.5_0.18_145)]" />
          </IconBtn>
        ) : (
          <>
            <span className="hidden sm:inline-flex">
              <IconBtn onClick={copy} title={copied ? "Copied!" : "Copy email"}>
                {copied ? <Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_145)]" /> : <Copy className="h-3.5 w-3.5" />}
              </IconBtn>
            </span>
            <IconBtn onClick={stop(onContacted)} title={contacted ? "Mark as uncontacted" : "Mark as contacted"} active={contacted}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${contacted ? "text-[oklch(0.55_0.16_160)]" : ""}`} />
            </IconBtn>
            <IconBtn onClick={stop(onStar)} title={starred ? "Unstar" : "Star"} active={starred}>
              <Star className={`h-3.5 w-3.5 ${starred ? "fill-[oklch(0.74_0.16_85)] text-[oklch(0.6_0.16_85)]" : ""}`} />
            </IconBtn>
            <IconBtn onClick={stop(onDelete)} title="Delete">
              <Trash2 className="h-3.5 w-3.5 text-[oklch(0.5_0.18_25)]" />
            </IconBtn>
          </>
        )}
      </div>
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-[oklch(0.55_0_0)] transition-transform group-hover:translate-x-0.5 sm:block" />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`clicky-sm grid h-7 w-7 place-items-center rounded-lg border transition ${
        active ? "border-[oklch(0.74_0.16_85)]/40 bg-[oklch(0.74_0.16_85)]/10" : "border-transparent text-[oklch(0.45_0_0)] hover:border-black/10 hover:bg-[oklch(0.96_0_0)]"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="alive rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: accent }}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[oklch(0.18_0_0)]">{value}</div>
    </div>
  );
}

function DetailDrawer({
  s,
  starred,
  contacted,
  note,
  onStar,
  onContacted,
  onNoteChange,
  onClose,
  onPrev,
  onNext,
  position,
  total,
  onDelete,
  onRestore,
}: {
  s: Submission;
  starred: boolean;
  contacted: boolean;
  note: string;
  onStar: () => void;
  onContacted: () => void;
  onNoteChange: (v: string) => void;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position: number;
  total: number;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const isDeleted = Boolean(s.deleted_at);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(note);
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => setDraft(note), [note, s.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const copyEmail = () => {
    navigator.clipboard.writeText(s.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveNote = () => {
    if (draft === note) return;
    onNoteChange(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]" />
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white animate-[slideInRight_220ms_cubic-bezier(0.22,1,0.36,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-black/5 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[oklch(0.68_0.22_40)] text-sm font-bold text-white">
                {(s.full_name?.[0] || s.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-[oklch(0.18_0_0)]">{s.full_name || s.email}</div>
                <div className="truncate text-xs text-[oklch(0.5_0_0)]">
                  Applied {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="clicky-sm shrink-0 rounded-lg p-1.5 text-[oklch(0.4_0_0)] hover:bg-black/5"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={onStar}
              className={`clicky-sm inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                starred
                  ? "border-[oklch(0.74_0.16_85)]/40 bg-[oklch(0.74_0.16_85)]/15 text-[oklch(0.45_0.16_85)]"
                  : "border-black/10 text-[oklch(0.35_0_0)] hover:bg-[oklch(0.96_0_0)]"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${starred ? "fill-[oklch(0.74_0.16_85)]" : ""}`} /> {starred ? "Starred" : "Star"}
            </button>
            <button
              onClick={onContacted}
              className={`clicky-sm inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                contacted
                  ? "border-[oklch(0.6_0.14_160)]/40 bg-[oklch(0.6_0.14_160)]/15 text-[oklch(0.4_0.14_160)]"
                  : "border-black/10 text-[oklch(0.35_0_0)] hover:bg-[oklch(0.96_0_0)]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> {contacted ? "Contacted" : "Mark contacted"}
            </button>
            <button
              onClick={copyEmail}
              className="clicky-sm inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.96_0_0)]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[oklch(0.55_0.18_145)]" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy email"}</span>
            </button>
            {isDeleted ? (
              <button
                onClick={onRestore}
                className="clicky-sm ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.55_0.18_145)] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </button>
            ) : (
              <>
                <button
                  onClick={onDelete}
                  className="clicky-sm inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.58_0.18_25)]/30 bg-[oklch(0.58_0.18_25)]/10 px-2.5 py-1.5 text-xs font-semibold text-[oklch(0.5_0.18_25)] hover:bg-[oklch(0.58_0.18_25)]/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <a
                  href={`mailto:${s.email}`}
                  className="clicky-sm ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.68_0.22_40)] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[oklch(0.5_0_0)]">
            <span>{position} of {total}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev}
                disabled={!onPrev}
                className="clicky-sm grid h-7 w-7 place-items-center rounded-md border border-black/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onNext}
                disabled={!onNext}
                className="clicky-sm grid h-7 w-7 place-items-center rounded-md border border-black/10 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
          <Field icon={Mail} label="Email" value={s.email} href={`mailto:${s.email}`} />
          {s.phone && <Field icon={Phone} label="Phone" value={s.phone} href={`tel:${s.phone}`} />}
          {s.linkedin && (
            <Field
              icon={Linkedin}
              label="LinkedIn"
              value={s.linkedin}
              href={s.linkedin.startsWith("http") ? s.linkedin : `https://${s.linkedin}`}
              external
            />
          )}
          {s.business && <LongField icon={Briefcase} label="Business" value={s.business} />}
          {s.goal && <LongField icon={Sparkles} label="Goal" value={s.goal} />}
          {s.referral_source && <Field icon={Users} label="Referral source" value={s.referral_source} />}

          <div className="rounded-xl border border-black/5 bg-[oklch(0.98_0_0)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">
                <StickyNote className="h-3 w-3" /> Private notes
              </div>
              {savedFlash && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[oklch(0.55_0.18_145)]">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveNote}
              placeholder="Add notes about this applicant…"
              rows={4}
              className="mt-2 w-full resize-y rounded-lg border border-black/10 bg-white p-2 text-sm text-[oklch(0.18_0_0)] outline-none placeholder:text-[oklch(0.55_0_0)] focus:border-[oklch(0.68_0.22_40)]/40"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={saveNote}
                disabled={draft === note}
                className="clicky-sm rounded-lg bg-[oklch(0.18_0_0)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-[oklch(0.18_0_0)]">
        <span className="truncate">{value}</span>
        {external && <ExternalLink className="h-3 w-3 text-[oklch(0.5_0_0)]" />}
      </div>
    </>
  );
  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel="noreferrer"
      className="alive rounded-xl border border-black/5 bg-[oklch(0.98_0_0)] p-3 transition hover:border-[oklch(0.68_0.22_40)]/30 hover:bg-white"
    >
      {content}
    </a>
  ) : (
    <div className="rounded-xl border border-black/5 bg-[oklch(0.98_0_0)] p-3">{content}</div>
  );
}

function LongField({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-[oklch(0.98_0_0)] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[oklch(0.18_0_0)]">{value}</div>
    </div>
  );
}
