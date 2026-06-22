// Server middleware: validates an InsForge-issued bearer token.
//
// Expects `Authorization: Bearer <jwt>` on the incoming request.
// On success, downstream handlers can read `context.userId` and
// `context.supabase` (a per-request InsForge client bound to the caller's
// token, so its RLS-aware queries are scoped to the calling user).
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@insforge/sdk";
import type { SupabaseLikeClient } from "./client";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const INSFORGE_URL = process.env.INSFORGE_URL;
    const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY;

    if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
      const missing = [
        ...(!INSFORGE_URL ? ["INSFORGE_URL"] : []),
        ...(!INSFORGE_ANON_KEY ? ["INSFORGE_ANON_KEY"] : []),
      ];
      const message = `Missing InsForge server environment variable(s): ${missing.join(
        ", ",
      )}.`;
      console.error(`[InsForge auth] ${message}`);
      throw new Response(message, { status: 500 });
    }

    const request = getRequest();
    if (!request?.headers) {
      throw new Response("Unauthorized: No request headers available", {
        status: 401,
      });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      throw new Response("Unauthorized: No authorization header provided", {
        status: 401,
      });
    }
    if (!authHeader.startsWith("Bearer ")) {
      throw new Response("Unauthorized: Only Bearer tokens are supported", {
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new Response("Unauthorized: No token provided", { status: 401 });
    }

    // Per-request InsForge client bound to the caller's JWT. We seed it
    // with the bearer via `accessToken` and verify by calling getCurrentUser.
    const insforge = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      accessToken: token,
    });

    const { data, error } = await insforge.auth.getCurrentUser();
    if (error || !data?.user?.id) {
      throw new Response("Unauthorized: Invalid token", { status: 401 });
    }

    return next({
      context: {
        // Re-exposed as `supabase` so existing handlers keep compiling —
        // this is actually a per-request InsForge client bound to the user.
        supabase: insforge as unknown as SupabaseLikeClient,
        userId: data.user.id,
        claims: {
          sub: data.user.id,
          email: data.user.email,
          access_token: token,
        },
      },
    });
  },
);