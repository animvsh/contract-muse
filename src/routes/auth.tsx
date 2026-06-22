import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  supabase,
  cacheAuthSession,
} from "@/integrations/supabase/client";
import { useAuth, rememberSession } from "@/hooks/use-auth";
import { toast } from "sonner";

const inputClass =
  "auth-input w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-[border-color,box-shadow,transform] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-50";
const primaryButtonClass =
  "clicky auth-primary-button w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-60";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Contract Muse" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (error) throw error;
        const accessToken = data?.accessToken ?? undefined;
        const userId = data?.user?.id;
        if (accessToken && userId) {
          cacheAuthSession({ accessToken, userId, email });
          rememberSession({ accessToken, userId, email });
        }
        toast.success("Account created — you're in");
        navigate({ to: "/app" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const accessToken = data?.accessToken ?? undefined;
        const userId = data?.user?.id;
        if (accessToken && userId) {
          cacheAuthSession({ accessToken, userId, email });
          rememberSession({ accessToken, userId, email });
        }
        navigate({ to: "/app" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (/invalid login credentials/i.test(msg)) {
        setNotice(
          "No account matches that email and password. Double-check, or create an account.",
        );
        toast.error("Can't sign in with that email and password");
      } else if (/already registered|already exists|user already/i.test(msg)) {
        setMode("signin");
        setNotice("That email already has an account. Try signing in.");
        toast.message("Account already exists");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    // InsForge sends a one-time code to the user's inbox; the reset page
    // collects the code + a new password and calls resetPassword().
    const { error } = await supabase.auth.sendResetPasswordEmail({ email });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotice(
      "Password reset email sent. Open it, copy the code, then set a new password.",
    );
    toast.success("Password reset email sent");
    navigate({
      to: "/reset-password",
      search: { email },
    });
  };

  return (
    <div className="min-h-screen bg-foreground p-3 text-foreground">
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] items-center justify-center overflow-hidden rounded-[24px] border border-primary/10 bg-card p-4 shadow-2xl sm:p-6">
        <div className="auth-card w-full max-w-sm rounded-3xl border border-border bg-card/90 p-7 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8">
          <Link
            to="/"
            className="clicky mb-6 flex w-fit items-center gap-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/15"
          >
            <BrandLogo className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              Contract Muse
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to your contract workspace"
              : "Get started with Contract Muse"}
          </p>
          {notice && (
            <div className="animate-pop mt-4 rounded-xl border border-primary/25 bg-accent/60 px-4 py-3 text-sm font-medium text-accent-foreground">
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            )}
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy}
              className={`${primaryButtonClass} flex items-center justify-center gap-2`}
            >
              {busy && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground" />
              )}
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          {mode === "signin" && (
            <button
              type="button"
              onClick={resetPassword}
              disabled={busy}
              className="clicky mt-3 w-full rounded-lg py-2 text-center text-xs font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:pointer-events-none disabled:opacity-50"
            >
              Forgot password?
            </button>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New to Contract Muse?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="clicky rounded-md px-1 py-0.5 font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}