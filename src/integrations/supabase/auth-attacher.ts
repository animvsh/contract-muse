// Client-side middleware: attaches the InsForge JWT as a
// `Authorization: Bearer <token>` header on serverFn RPCs so the server
// middleware can verify the user.
//
// Reads the token from our localStorage mirror (see auth-token.ts) since
// the SDK does not expose getSession() publicly.
import { createMiddleware } from "@tanstack/react-start";
import { loadCachedAuthSession } from "./auth-token";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const cached = loadCachedAuthSession();
    const token = cached?.accessToken;
    return next(
      token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    );
  },
);