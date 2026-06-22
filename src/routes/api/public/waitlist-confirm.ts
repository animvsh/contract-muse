import { createFileRoute } from "@tanstack/react-router";

// Public endpoint called right after a successful waitlist signup.
// Sends a "thanks for signing up" confirmation email through InsForge's
// email API (no Lovable email infrastructure required).
//
// Configure INSFORGE_URL + INSFORGE_API_KEY on the server. We use the
// admin client to call `insforge.emails.send()`.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export const Route = createFileRoute("/api/public/waitlist-confirm")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            email?: string;
            name?: string;
          };
          const email = (body.email || "").trim().toLowerCase();
          const name = (body.name || "").trim() || "there";

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json(
              { ok: false, error: "invalid_email" },
              { status: 400, headers: cors },
            );
          }

          // Fire-and-forget transactional email. If InsForge email isn't
          // configured we no-op gracefully so signup never fails.
          try {
            const { insforgeAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            const html = renderConfirmationHtml(name);
            await insforgeAdmin.emails.send({
              to: email,
              subject: "You're on the Contract Muse waitlist",
              html,
            });
          } catch (err) {
            console.warn(
              "[waitlist-confirm] email send skipped:",
              (err as Error).message,
            );
          }

          return Response.json({ ok: true }, { headers: cors });
        } catch (e) {
          return Response.json(
            { ok: false, error: (e as Error).message },
            { status: 500, headers: cors },
          );
        }
      },
    },
  },
});

function renderConfirmationHtml(name: string) {
  const safeName = escapeHtml(name);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fff8f1;font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:18px;color:#c2410c">Contract Muse</div>
    <h1 style="margin:24px 0 12px;font-size:28px;letter-spacing:-0.02em">You're on the list, ${safeName}.</h1>
    <p style="line-height:1.6;color:#444;margin:0 0 16px">
      Thanks for signing up to the Contract Muse waitlist. We'll reach out
      personally to walk you through the platform and get you set up live.
    </p>
    <p style="margin-top:32px;font-size:12px;color:#999">— The Contract Muse team</p>
  </div>
</body></html>`;
}

function renderConfirmationText(name: string) {
  return `You're on the list, ${name}.

Thanks for signing up to the Contract Muse waitlist. We'll reach out personally.

— The Contract Muse team`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}