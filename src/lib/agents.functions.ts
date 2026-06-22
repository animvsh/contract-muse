import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuthHeader } from "@/integrations/supabase/auth-client-middleware";

type AgentSpec = {
  name: string;
  description: string;
  trigger: { type: string; description: string };
  steps: Array<{ title: string; integration: string; action: string }>;
};

async function callLovableAI(systemPrompt: string, userPrompt: string, schema: object, toolName: string) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const baseURL = process.env.MINIMAX_BASE_URL || "https://api.MiniMax.io/v1";
  const model = process.env.MINIMAX_FAST_MODEL || process.env.MINIMAX_MODEL || "MiniMax-M3";

  if (!apiKey) throw new Error("MINIMAX_API_KEY not configured");

  const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "function", function: { name: toolName, description: "structured output", parameters: schema } }],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text}`);
  }
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("No tool call returned");
  return JSON.parse(args);
}

export const createAgentFromPrompt = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { prompt: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const spec = (await callLovableAI(
      "You design automation agents. Given a user request, produce a clean, plausible agent specification with 3-5 concrete steps. Use real integrations from: Notion, Slack, Gmail, Google Drive, Linear, GitHub, HubSpot, Stripe, Zoom, Figma.",
      data.prompt,
      {
        type: "object",
        properties: {
          name: { type: "string", description: "Short title-cased name" },
          description: { type: "string", description: "One sentence" },
          trigger: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["schedule", "webhook", "manual", "event"] },
              description: { type: "string" },
            },
            required: ["type", "description"],
          },
          steps: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                integration: { type: "string" },
                action: { type: "string" },
              },
              required: ["title", "integration", "action"],
            },
          },
        },
        required: ["name", "description", "trigger", "steps"],
      },
      "create_agent_spec",
    )) as AgentSpec;

    const { data: row, error } = await supabase
      .from("agents")
      .insert({ name: spec.name, description: spec.description, spec, status: "active", user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const runAgent = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuthHeader, requireSupabaseAuth])
  .inputValidator((data: { agentId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: agent } = await supabase.from("agents").select("*").eq("id", data.agentId).single();
    if (!agent) throw new Error("Agent not found");

    const result = await callLovableAI(
      "You simulate an agent execution. Generate a realistic but fictional run log with 4-8 short bullet lines describing what the agent did and what it produced. Be specific.",
      `Agent: ${agent.name}\nDescription: ${agent.description}\nSpec: ${JSON.stringify(agent.spec)}`,
      {
        type: "object",
        properties: {
          summary: { type: "string", description: "One-line summary of what happened" },
          log_lines: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
        },
        required: ["summary", "log_lines"],
      },
      "agent_run_result",
    );

    const log = `${result.summary}\n\n${result.log_lines.map((l: string) => `• ${l}`).join("\n")}`;
    await supabase.from("agent_runs").insert({ agent_id: data.agentId, log, status: "completed", user_id: userId });
    await supabase
      .from("agents")
      .update({ runs_count: (agent.runs_count ?? 0) + 1 })
      .eq("id", data.agentId);

    return { log, lines: result.log_lines as string[], summary: result.summary as string };
  });
