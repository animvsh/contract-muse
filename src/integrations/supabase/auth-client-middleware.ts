// Duplicate of auth-attacher kept for compatibility with handlers that
// import `attachSupabaseAuthHeader`. Both export the same middleware.
import { createMiddleware } from "@tanstack/react-start";
import { loadCachedAuthSession } from "./auth-token";

export const attachSupabaseAuthHeader = createMiddleware({
  type: "function",
}).client(async ({ next }) => {
  const cached = loadCachedAuthSession();
  const token = cached?.accessToken;
  return next(token ? { headers: { Authorization: `Bearer ${token}` } } : {});
});