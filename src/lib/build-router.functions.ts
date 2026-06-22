import { createServerFn } from "@tanstack/react-start";

export type DemoAppId = "phone" | "leaderboard" | "bugs";

const SCHEMA = {
  type: "object",
  properties: {
    appId: { type: "string", enum: ["phone", "leaderboard", "bugs"] },
    confidence: { type: "number" },
    reason: { type: "string" },
  },
  required: ["appId", "confidence", "reason"],
  additionalProperties: false,
};

const SYSTEM = `You route a user's natural-language build request to ONE of three pre-built demo apps for Contract Muse Build.

Apps:
- "phone": Business Support Phone Line. AI voice line that answers customer questions from company knowledge, captures leads, escalates. Triggers: phone, call, support line, voice agent, IVR, customer service, lead capture, escalation.
- "leaderboard": Builder Leaderboard. Internal dashboard ranking engineers by commits, PRs, features shipped, tokens used, lines changed. Triggers: leaderboard, builders, engineers, devs, ship, commits, tokens, GitHub, Linear, productivity, who's building.
- "bugs": Bugs & User Activity Dashboard. Product health dashboard combining bugs, runtime errors, user sessions, affected users, alerts. Triggers: bugs, errors, crashes, user activity, sessions, product health, pilot issues, alerts, monitoring.

Pick the closest match. If truly ambiguous, default to "leaderboard". Return JSON only.`;

export const routeBuildPrompt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { prompt?: string };
    if (!d?.prompt || typeof d.prompt !== "string") throw new Error("prompt required");
    return { prompt: d.prompt.slice(0, 2000) };
  })
  .handler(async ({ data }): Promise<{ appId: DemoAppId; confidence: number; reason: string }> => {
    const apiKey = process.env.MINIMAX_API_KEY;
    const baseURL = process.env.MINIMAX_BASE_URL || "https://api.MiniMax.io/v1";
    const model = process.env.MINIMAX_FAST_MODEL || process.env.MINIMAX_MODEL || "MiniMax-M3";

    if (!apiKey) {
      return { appId: "leaderboard", confidence: 0, reason: "No API key, falling back." };
    }

    try {
      // MiniMax exposes an OpenAI-compatible /v1/chat/completions endpoint
      // with tool-calling support, so we keep the same payload shape that
      // the original Lovable gateway used.
      const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: data.prompt },
          ],
          tools: [
            {
              type: "function",
              function: { name: "route_build", description: "pick demo app", parameters: SCHEMA },
            },
          ],
          tool_choice: { type: "function", function: { name: "route_build" } },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`MiniMax ${res.status}: ${body.slice(0, 240)}`);
      }
      const j = await res.json();
      const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("No tool call in response");
      const parsed = JSON.parse(args);
      const appId = (["phone", "leaderboard", "bugs"] as const).includes(parsed.appId)
        ? (parsed.appId as DemoAppId)
        : "leaderboard";
      return { appId, confidence: Number(parsed.confidence) || 0.5, reason: String(parsed.reason || "") };
    } catch (err) {
      console.warn("[build-router] MiniMax call failed, using keyword fallback", err);
      const p = data.prompt.toLowerCase();
      const appId: DemoAppId = /phone|call|voice|support|ivr/.test(p)
        ? "phone"
        : /bug|error|crash|session|alert|activity/.test(p)
          ? "bugs"
          : "leaderboard";
      return { appId, confidence: 0.4, reason: "fallback keyword match" };
    }
  });