import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Contract Muse" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email: queryEmail } = Route.useSearch();
  const [email, setEmail] = useState(queryEmail ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "confirm">(
    queryEmail ? "confirm" : "request",
  );
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.sendResetPasswordEmail({ email });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset code sent. Check your inbox.");
    setStage("confirm");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPassword({
      newPassword: password,
      otp,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — sign in with your new password");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.04_0_0)] p-3">
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] items-center justify-center overflow-hidden rounded-[24px] bg-white p-6 shadow-2xl">
        <form
          onSubmit={stage === "request" ? requestCode : submit}
          className="w-full max-w-sm rounded-3xl border border-black/5 bg-white/80 p-8 backdrop-blur"
        >
          <Link to="/" className="mb-6 flex items-center gap-2.5">
            <BrandLogo className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              Contract Muse
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-[oklch(0.45_0_0)]">
            {stage === "request"
              ? "Enter your email and we'll send a one-time code."
              : `Enter the code we sent to ${email} and choose a new password.`}
          </p>

          {stage === "request" ? (
            <>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="mt-6 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.68_0.22_40)] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-[oklch(0.68_0.22_40)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/30 hover:bg-[oklch(0.62_0.22_40)] disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send reset code"}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={busy}
                className="mt-6 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.68_0.22_40)] disabled:opacity-50"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="mt-3 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.68_0.22_40)] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-[oklch(0.68_0.22_40)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.68_0.22_40)]/30 hover:bg-[oklch(0.62_0.22_40)] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save new password"}
              </button>
              <button
                type="button"
                onClick={() => setStage("request")}
                disabled={busy}
                className="mt-2 w-full text-xs font-semibold text-[oklch(0.55_0.2_40)] hover:underline"
              >
                Use a different email
              </button>
            </>
          )}

          <Link
            to="/auth"
            className="mt-4 block text-center text-xs font-semibold text-[oklch(0.55_0.2_40)] hover:underline"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  );
}