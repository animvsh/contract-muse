import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuthHeader } from "@/integrations/supabase/auth-client-middleware";
import { z } from "zod";

const CLIENT_LABELS: Record<string, string> = {
  opencode: "OpenCode",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  custom: "Custom CLI",
};

function generateKey(client: string): { full: string; prefix: string } {
  const prefix = `bvr_${client.replace("-", "")}_`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 36);
  return { full: `${prefix}${rand}`, prefix: prefix + rand.slice(0, 4) };
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const createAccessKey = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: {
    name: string;
    client: string;
    scope: string;
    scopeLabel?: string;
    permission: string;
    safety: string;
    expiresInDays?: number;
  }) =>
    z
      .object({
        name: z.string().min(1).max(80),
        client: z.enum(["opencode", "claude-code", "cursor", "windsurf", "custom"]),
        scope: z.enum(["workspace", "team", "collection", "sandbox"]),
        scopeLabel: z.string().max(80).optional(),
        permission: z.enum(["read", "sandbox", "drafts", "run-approved", "admin"]),
        safety: z.enum(["strict", "balanced", "trusted"]),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { full, prefix } = generateKey(data.client);
    const hash = await sha256(full);
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: row, error } = await supabase
      .from("access_keys")
      .insert({
        user_id: userId,
        name: data.name,
        client: data.client,
        scope: data.scope,
        scope_label: data.scopeLabel ?? null,
        permission: data.permission,
        safety: data.safety,
        key_prefix: prefix,
        key_hash: hash,
        key_plaintext: full,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("access_key_events").insert({
      user_id: userId,
      access_key_id: row.id,
      kind: "created",
      message: `${CLIENT_LABELS[data.client] ?? data.client} key "${data.name}" was created.`,
    });

    return row;
  });

export const listAccessKeys = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("access_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAccessKey = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: key }, { data: events }] = await Promise.all([
      supabase.from("access_keys").select("*").eq("id", data.id).single(),
      supabase
        .from("access_key_events")
        .select("*")
        .eq("access_key_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { key, events: events ?? [] };
  });

export const updateAccessKeyStatus = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "active" | "paused" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "paused"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("access_keys").update({ status: data.status }).eq("id", data.id);
    await supabase.from("access_key_events").insert({
      user_id: userId,
      access_key_id: data.id,
      kind: "status",
      message: data.status === "active" ? "Key resumed." : "Key paused.",
    });
    return { ok: true };
  });

export const deleteAccessKey = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("access_keys").delete().eq("id", data.id);
    return { ok: true };
  });

export const rotateAccessKey = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("access_keys")
      .select("client, name")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Key not found");
    const { full, prefix } = generateKey(existing.client);
    const hash = await sha256(full);
    const { data: row, error } = await supabase
      .from("access_keys")
      .update({ key_prefix: prefix, key_hash: hash, key_plaintext: full })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("access_key_events").insert({
      user_id: userId,
      access_key_id: data.id,
      kind: "rotated",
      message: `Key "${existing.name}" was rotated.`,
    });
    return row;
  });
