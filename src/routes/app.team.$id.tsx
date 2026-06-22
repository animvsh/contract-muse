import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/app/team/$id")({
  component: TeamSpaceDetail,
});

type Space = { id: string; name: string; color: string };
type Member = { id: string; email: string; role: string };

function TeamSpaceDetail() {
  const { id } = Route.useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const load = async () => {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from("team_spaces").select("*").eq("id", id).single(),
      supabase.from("space_members").select("*").eq("space_id", id).order("created_at"),
    ]);
    if (s) setSpace(s as Space);
    setMembers((m as Member[] | null) ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const invite = async () => {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    const { data: u } = await supabase.auth.getCurrentUser();
    const { error } = await supabase.from("space_members").insert({ space_id: id, email: email.trim(), role, user_id: u.user?.id });
    if (error) return toast.error(error.message);
    toast.success(`Invite sent to ${email}`);
    setEmail("");
    load();
  };

  const remove = async (mid: string) => {
    await supabase.from("space_members").delete().eq("id", mid);
    load();
  };

  if (!space) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link to="/app/team" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Team Spaces
      </Link>
      <div className="mb-8 flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl" style={{ background: space.color }} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
          <p className="text-sm text-muted-foreground">{members.length} members</p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Mail className="h-3 w-3" /> Invite people
        </div>
        <div className="flex gap-2">
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
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={invite} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Invite
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Members</div>
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/40 p-8 text-center text-sm text-muted-foreground">
            No members yet — invite someone above.
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04] rounded-2xl border border-black/[0.06] bg-white/70 backdrop-blur">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                  {m.email[0]?.toUpperCase()}
                </div>
                <div className="flex-1 truncate text-sm">{m.email}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{m.role}</span>
                <button onClick={() => remove(m.id)} className="text-muted-foreground/60 hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
