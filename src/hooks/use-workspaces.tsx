import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Workspace = {
  id: string;
  name: string;
  company: string;
  industry: string;
  color: string; // oklch
  createdAt: string;
};

type Ctx = {
  workspaces: Workspace[];
  current: Workspace;
  switchTo: (id: string) => void;
  createWorkspace: (input: Omit<Workspace, "id" | "createdAt">) => Workspace;
  removeWorkspace: (id: string) => void;
  renameWorkspace: (id: string, patch: Partial<Pick<Workspace, "name" | "company" | "industry" | "color">>) => void;
};

const STORAGE_KEY = "beevr.workspaces.v1";
const CURRENT_KEY = "beevr.workspaces.current.v1";

const SEED: Workspace[] = [
  {
    id: "ws_default",
    name: "Beevr HQ",
    company: "Beevr Inc.",
    industry: "AI Tooling",
    color: "oklch(0.68 0.22 40)",
    createdAt: new Date().toISOString(),
  },
];

const WorkspaceContext = createContext<Ctx | null>(null);

function load(): { workspaces: Workspace[]; currentId: string } {
  if (typeof window === "undefined") return { workspaces: SEED, currentId: SEED[0].id };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ws = raw ? (JSON.parse(raw) as Workspace[]) : SEED;
    const cur = localStorage.getItem(CURRENT_KEY) || ws[0]?.id || SEED[0].id;
    const valid = ws.find((w) => w.id === cur)?.id ?? ws[0]?.id ?? SEED[0].id;
    return { workspaces: ws.length ? ws : SEED, currentId: valid };
  } catch {
    return { workspaces: SEED, currentId: SEED[0].id };
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SEED);
  const [currentId, setCurrentId] = useState<string>(SEED[0].id);

  useEffect(() => {
    const { workspaces, currentId } = load();
    setWorkspaces(workspaces);
    setCurrentId(currentId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CURRENT_KEY, currentId);
  }, [currentId]);

  const current = useMemo(
    () => workspaces.find((w) => w.id === currentId) ?? workspaces[0],
    [workspaces, currentId],
  );

  const switchTo = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const createWorkspace = useCallback<Ctx["createWorkspace"]>((input) => {
    const ws: Workspace = {
      ...input,
      id: `ws_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setWorkspaces((prev) => [...prev, ws]);
    setCurrentId(ws.id);
    return ws;
  }, []);

  const removeWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (next.length === 0) return prev; // never empty
      if (currentId === id) setCurrentId(next[0].id);
      return next;
    });
  }, [currentId]);

  const renameWorkspace = useCallback<Ctx["renameWorkspace"]>((id, patch) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, current, switchTo, createWorkspace, removeWorkspace, renameWorkspace }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaces must be used inside WorkspaceProvider");
  return ctx;
}
