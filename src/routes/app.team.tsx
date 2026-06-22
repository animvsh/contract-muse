import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Mail,
  Plus,
  X,
  Shield,
  Eye,
  Pencil,
  Crown,
  Check,
  Clock,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/app/team")({
  component: WorkspaceManagement,
});

type Member = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  user_id: string | null;
};

const ROLES = [
  {
    key: "owner",
    label: "Owner",
    icon: Crown,
    color: "oklch(0.7 0.18 60)",
    desc: "Full control. Manage billing, members, integrations and delete the workspace.",
  },
  {
    key: "admin",
    label: "Admin",
    icon: Shield,
    color: "oklch(0.65 0.2 270)",
    desc: "Manage members, connections, agents and APIs. Cannot change billing.",
  },
  {
    key: "editor",
    label: "Editor",
    icon: Pencil,
    color: "oklch(0.7 0.16 145)",
    desc: "Create and edit agents, APIs and MCPs. Can ask the brain anything.",
  },
  {
    key: "viewer",
    label: "Viewer",
    icon: Eye,
    color: "oklch(0.65 0.05 250)",
    desc: "Read-only access. Can ask questions but cannot change anything.",
  },
] as const;

const PERMISSION_MATRIX: { label: string; roles: Record<string, boolean> }[] = [
  { label: "Ask the brain", roles: { owner: true, admin: true, editor: true, viewer: true } },
  { label: "View agents & APIs", roles: { owner: true, admin: true, editor: true, viewer: true } },
  { label: "Create agents, APIs, MCPs", roles: { owner: true, admin: true, editor: true, viewer: false } },
  { label: "Manage connections", roles: { owner: true, admin: true, editor: false, viewer: false } },
  { label: "Invite & remove members", roles: { owner: true, admin: true, editor: false, viewer: false } },
  { label: "Issue access keys", roles: { owner: true, admin: true, editor: false, viewer: false } },
  { label: "Billing & workspace settings", roles: { owner: true, admin: false, editor: false, viewer: false } },
];

function roleMeta(role: string) {
  return ROLES.find((r) => r.key === role) ?? ROLES[2];
}

function WorkspaceManagement() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [members, setMembers] = useState<Member[]>([]);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const ensureWorkspace = async () => {
    const { data: u } = await supabase.auth.getCurrentUser();
    setMeEmail(u.user?.email ?? null);
    if (!u.user) return null;
    const { data: existing } = await supabase
      .from("team_spaces")
      .select("*")
      .order("created_at")
      .limit(1);
    let ws = existing?.[0];
    if (!ws) {
      const { data: created } = await supabase
        .from("team_spaces")
        .insert({ name: "My Workspace", color: "oklch(0.7 0.18 35)", user_id: u.user.id })
        .select()
        .single();
      ws = created ?? undefined;
    }
    if (!ws) return null;
    setWorkspaceId(ws.id);
    setWorkspaceName(ws.name);
    return ws.id;
  };

  const loadMembers = async (wsId: string) => {
    const { data } = await supabase
      .from("space_members")
      .select("*")
      .eq("space_id", wsId)
      .order("created_at");
    setMembers((data as Member[] | null) ?? []);
  };

  useEffect(() => {
    (async () => {
      const wsId = await ensureWorkspace();
      if (wsId) await loadMembers(wsId);
      setLoading(false);
    })();
  }, []);

  const invite = async () => {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (!workspaceId) return;
    const { data: u } = await supabase.auth.getCurrentUser();
    const { error } = await supabase.from("space_members").insert({
      space_id: workspaceId,
      email: email.trim().toLowerCase(),
      role,
      user_id: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`Invite sent to ${email}`);
    setEmail("");
    loadMembers(workspaceId);
  };

  const updateRole = async (mid: string, newRole: string) => {
    const { error } = await supabase.from("space_members").update({ role: newRole }).eq("id", mid);
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    if (workspaceId) loadMembers(workspaceId);
  };

  const remove = async (mid: string) => {
    await supabase.from("space_members").delete().eq("id", mid);
    if (workspaceId) loadMembers(workspaceId);
  };

  const renameWorkspace = async (next: string) => {
    if (!workspaceId || !next.trim() || next === workspaceName) return;
    setWorkspaceName(next);
    await supabase.from("team_spaces").update({ name: next.trim() }).eq("id", workspaceId);
    toast.success("Workspace renamed");
  };

  const filtered = useMemo(
    () =>
      members.filter((m) =>
        query.trim() ? m.email.toLowerCase().includes(query.toLowerCase()) : true,
      ),
    [members, query],
  );

  const roleCounts = useMemo(() => {
    const c: Record<string, number> = { owner: 1, admin: 0, editor: 0, viewer: 0 };
    members.forEach((m) => {
      c[m.role] = (c[m.role] ?? 0) + 1;
    });
    return c;
  }, [members]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <PageHeader
        title="Workspace"
        subtitle="Manage who's on your team and what they can do"
      />

      {/* Workspace identity card */}
      <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-semibold text-white"
            style={{ background: "oklch(0.7 0.18 35)" }}
          >
            {workspaceName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onBlur={(e) => renameWorkspace(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none focus:bg-white/60 rounded px-1 -mx-1"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              {members.length + 1} {members.length === 0 ? "member" : "members"} · You're the owner
            </p>
          </div>
          <div className="hidden gap-3 sm:flex">
            {ROLES.map((r) => (
              <div key={r.key} className="text-center">
                <div className="text-lg font-semibold tabular-nums">{roleCounts[r.key] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite */}
      <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Mail className="h-3 w-3" /> Invite people
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invite()}
            placeholder="name@company.com"
            type="email"
            className="flex-1 rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-sm outline-none"
          >
            {ROLES.filter((r) => r.key !== "owner").map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={invite}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Send invite
          </button>
        </div>
        <p className="mt-2.5 text-[11px] text-muted-foreground">
          {roleMeta(role).desc}
        </p>
      </div>

      {/* Members list */}
      <div className="mb-8 rounded-2xl border border-black/[0.06] bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            Members
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {members.length + 1}
            </span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="w-48 rounded-lg border border-black/[0.06] bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary/40"
            />
          </div>
        </div>

        <ul className="divide-y divide-black/[0.04]">
          {/* Owner row (current user) */}
          <li className="flex items-center gap-3 px-5 py-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: "oklch(0.7 0.18 60)" }}
            >
              {meEmail?.[0]?.toUpperCase() ?? "Y"}
            </div>
            <div className="flex-1 truncate">
              <div className="truncate text-sm font-medium">{meEmail ?? "You"}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" /> Active · You
              </div>
            </div>
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
              style={{ background: "oklch(0.7 0.18 60)" }}
            >
              <Crown className="h-3 w-3" /> Owner
            </span>
          </li>

          {loading ? (
            <li className="px-5 py-8 text-center text-xs text-muted-foreground">Loading…</li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-10 text-center text-xs text-muted-foreground">
              {query ? "No members match." : "No teammates yet — invite someone above."}
            </li>
          ) : (
            filtered.map((m) => {
              const meta = roleMeta(m.role);
              const Icon = meta.icon;
              const isPending = !m.user_id || m.email !== meEmail;
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: meta.color }}
                  >
                    {m.email[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="truncate text-sm font-medium">{m.email}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      {isPending ? (
                        <>
                          <Clock className="h-3 w-3" /> Invite pending
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" /> Active
                        </>
                      )}
                    </div>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) => updateRole(m.id, e.target.value)}
                    className="rounded-lg border border-black/[0.06] bg-white py-1 pl-2 pr-1 text-xs outline-none hover:border-primary/40"
                  >
                    {ROLES.filter((r) => r.key !== "owner").map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white sm:flex"
                    style={{ background: meta.color }}
                  >
                    <Icon className="h-2.5 w-2.5" /> {meta.label}
                  </span>
                  <button
                    onClick={() => remove(m.id)}
                    className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Roles & permissions */}
      <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Shield className="h-3 w-3" /> Roles & permissions
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Each role gets a different scope of access to the workspace.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.key}
                className="rounded-xl border border-black/[0.05] bg-white/60 p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                    style={{ background: r.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-sm font-medium">{r.label}</div>
                </div>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{r.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Matrix */}
        <div className="mt-5 overflow-hidden rounded-xl border border-black/[0.05]">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Capability</th>
                {ROLES.map((r) => (
                  <th key={r.key} className="px-3 py-2 text-center font-medium text-muted-foreground">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.label}>
                  <td className="px-3 py-2 text-foreground/80">{row.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.key} className="px-3 py-2 text-center">
                      {row.roles[r.key] ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-red-600/80">
          <MoreHorizontal className="h-3 w-3" /> Danger zone
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Deleting this workspace removes all members, agents, APIs and connections. This can't be undone.
          </p>
          <button
            onClick={() => toast.error("Contact support to delete a workspace.")}
            className="rounded-lg border border-red-500/30 bg-white/70 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete workspace
          </button>
        </div>
      </div>
    </div>
  );
}
