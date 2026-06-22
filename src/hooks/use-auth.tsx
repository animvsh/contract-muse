import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  supabase,
  cacheAuthSession,
  clearCachedAuthSession,
  type CachedAuthSession,
} from "@/integrations/supabase/client";

// Minimal auth shape — both Supabase-style and InsForge-style sessions
// collapse to this for the rest of the app.
export type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

type AuthCtx = {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;
    const finish = (s: AuthSession | null) => {
      resolved = true;
      setSession(s);
      setLoading(false);
    };

    // Verify the locally-cached session by calling getCurrentUser().
    // The SDK uses the accessToken we seeded in client.ts to make this
    // request; if the token is stale, getCurrentUser returns null.
    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getCurrentUser();
        if (error || !data?.user) {
          clearCachedAuthSession();
          finish(null);
          return;
        }
        const cached =
          (window.localStorage.getItem("insforge.auth.session.v1") &&
            JSON.parse(window.localStorage.getItem("insforge.auth.session.v1")!)) as
            | CachedAuthSession
            | null;
        if (!cached?.accessToken) {
          finish(null);
          return;
        }
        finish({
          access_token: cached.accessToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: (data.user as { user_metadata?: Record<string, unknown> })
              .user_metadata,
          },
        });
      } catch (err) {
        console.warn("[auth] bootstrap failed", err);
        clearCachedAuthSession();
        finish(null);
      }
    };
    void bootstrap();

    // Safety net: don't block UI forever if InsForge hangs.
    const t = window.setTimeout(() => {
      if (!resolved) finish(null);
    }, 3000);

    // Cross-tab sync — when another tab signs in/out, mirror their state.
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== "insforge.auth.session.v1") return;
      const next = ev.newValue ? (JSON.parse(ev.newValue) as CachedAuthSession) : null;
      if (!next) {
        finish(null);
        return;
      }
      finish({
        access_token: next.accessToken,
        user: { id: next.userId, email: next.email },
      });
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
          clearCachedAuthSession();
          setSession(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// Helper exposed so auth forms can mirror the session into localStorage
// after a successful signIn/signUp. Centralized here so we don't sprinkle
// localStorage.setItem calls across the codebase.
export function rememberSession(s: CachedAuthSession) {
  cacheAuthSession(s);
}