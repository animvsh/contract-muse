import { useCallback, useEffect, useState } from "react";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role: MemberRole;
  status: "active" | "invited";
  joinedAt: string;
  // mock usage
  usage: {
    agentRuns: number;
    apiCalls: number;
    storageMB: number;
    lastActiveAt: string;
  };
};

const KEY = "beevr.workspace.members.v1";

function seedFor(workspaceId: string, ownerEmail: string): WorkspaceMember[] {
  return [
    {
      id: `m_${workspaceId}_owner`,
      workspaceId,
      email: ownerEmail,
      name: ownerEmail.split("@")[0],
      role: "owner",
      status: "active",
      joinedAt: new Date().toISOString(),
      usage: { agentRuns: 142, apiCalls: 3210, storageMB: 184, lastActiveAt: new Date().toISOString() },
    },
  ];
}

function loadAll(): WorkspaceMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkspaceMember[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: WorkspaceMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useWorkspaceMembers(workspaceId: string | undefined, ownerEmail: string | undefined) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    let all = loadAll();
    let scoped = all.filter((m) => m.workspaceId === workspaceId);
    if (scoped.length === 0 && ownerEmail) {
      scoped = seedFor(workspaceId, ownerEmail);
      all = [...all.filter((m) => m.workspaceId !== workspaceId), ...scoped];
      saveAll(all);
    }
    setMembers(scoped);
  }, [workspaceId, ownerEmail]);

  const persist = useCallback((next: WorkspaceMember[]) => {
    if (!workspaceId) return;
    setMembers(next);
    const all = loadAll().filter((m) => m.workspaceId !== workspaceId);
    saveAll([...all, ...next]);
  }, [workspaceId]);

  const invite = useCallback(
    (email: string, role: MemberRole) => {
      if (!workspaceId) return;
      const m: WorkspaceMember = {
        id: `m_${Math.random().toString(36).slice(2, 9)}`,
        workspaceId,
        email,
        name: email.split("@")[0],
        role,
        status: "invited",
        joinedAt: new Date().toISOString(),
        usage: { agentRuns: rand(0, 25), apiCalls: rand(0, 400), storageMB: rand(0, 30), lastActiveAt: new Date(Date.now() - rand(0, 7) * 86400000).toISOString() },
      };
      persist([...members, m]);
    },
    [workspaceId, members, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(members.filter((m) => m.id !== id));
    },
    [members, persist],
  );

  const setRole = useCallback(
    (id: string, role: MemberRole) => {
      persist(members.map((m) => (m.id === id ? { ...m, role } : m)));
    },
    [members, persist],
  );

  const resend = useCallback((id: string) => {
    // mock: just bump joinedAt
    persist(members.map((m) => (m.id === id ? { ...m, joinedAt: new Date().toISOString() } : m)));
  }, [members, persist]);

  return { members, invite, remove, setRole, resend };
}
