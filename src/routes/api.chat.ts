import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  createMinimaxProvider,
  DEFAULT_MODEL,
  FAST_MODEL,
} from "@/lib/ai-gateway";

type ChatRequestBody = { messages?: unknown };

const tools = {
  createPlan: tool({
    description:
      "FIRST tool call of every response. Lay out a plan as 3-5 high-level parent tasks, each with 1-3 short sub-tasks. Use kebab-case unique IDs. After this, call updateStep to move tasks through 'in-progress' → 'done' (or 'warning') as you actually work.",
    inputSchema: z.object({
      tasks: z.array(z.object({
        id: z.string().describe("Unique kebab-case id, e.g. 'research-docs'"),
        title: z.string().describe("Short parent task title (3-6 words)"),
        subtasks: z.array(z.object({
          id: z.string(),
          title: z.string().describe("Short sub-task title (3-6 words)"),
        })).min(1).max(4),
      })).min(3).max(6),
    }),
    execute: async ({ tasks }) => {
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true, count: tasks.length };
    },
  }),
  updateStep: tool({
    description:
      "Update the status of one plan task or sub-task. Call this BEFORE starting work on a step (status: 'in-progress'), and AFTER finishing it (status: 'done' or 'warning'). One step at a time.",
    inputSchema: z.object({
      id: z.string().describe("The task or sub-task id from the plan"),
      status: z.enum(["pending", "in-progress", "done", "warning"]),
      note: z.string().optional().describe("Optional one-sentence note about what happened"),
    }),
    execute: async ({ id, status, note }) => {
      await new Promise((r) => setTimeout(r, 350));
      return { ok: true, id, status, note };
    },
  }),
  searchNotion: tool({
    description: "Search the user's Notion workspace for documents, notes, or pages.",
    inputSchema: z.object({ query: z.string().describe("Search keywords") }),
    execute: async ({ query }) => {
      await new Promise((r) => setTimeout(r, 700));
      const all = [
        { title: "Beevr Handbook · Employment & Hiring Policy", snippet: "Standard Beevr template v3 — comp grid, equity (4y/1y cliff), PTO, IP assignment.", url: "notion://beevr/handbook/employment" },
        { title: "Q3 2026 Roadmap", snippet: "Pillars: Cloud Builds GA, Approvals v2, MCP keys, /docs polish. Ship by Sep 30.", url: "notion://beevr/roadmap/q3" },
        { title: "Beevr Engineering Levels", snippet: "L1–L7 ladder with comp bands and expectations.", url: "notion://beevr/eng/levels" },
        { title: "About Beevr", snippet: "Beevr is a chat-native company brain that builds and hosts agents safely.", url: "notion://beevr/about" },
        { title: "Pricing FAQ — Internal", snippet: "Tiers: Starter $0, Team $25/seat, Business $99/seat. Enterprise on request.", url: "notion://beevr/pricing-faq" },
        { title: "Customer Onboarding Playbook", snippet: "Day 0 welcome, Day 3 check-in, Day 14 health review.", url: "notion://beevr/onboarding" },
      ];
      const q = query.toLowerCase();
      const results = all.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.snippet.toLowerCase().includes(q) ||
        q.split(/\s+/).some((w) => w.length > 2 && (r.title + r.snippet).toLowerCase().includes(w)),
      );
      return { results: results.length ? results.slice(0, 4) : all.slice(0, 3) };
    },
  }),
  searchContacts: tool({
    description: "Look up a person in Gmail / Google Contacts by name.",
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => {
      await new Promise((r) => setTimeout(r, 600));
      const slug = name.toLowerCase().replace(/[^a-z]/g, "");
      return { matches: [{ name, email: `${slug}@beevr.dev`, title: "Engineering", recentThreads: 3, lastSeen: "2 days ago" }] };
    },
  }),
  searchEmails: tool({
    description: "Search the user's Gmail inbox for recent threads matching a query.",
    inputSchema: z.object({ query: z.string(), days: z.number().optional() }),
    execute: async ({ query, days = 7 }) => {
      await new Promise((r) => setTimeout(r, 750));
      const threads = [
        { from: "maya@northwind.co", subject: "Re: Pricing for 50 seats", preview: "Thanks — can we get the Business tier at $79/seat for an annual deal?", receivedAt: "2d ago" },
        { from: "jordan@acme.dev", subject: "Pricing question", preview: "Quick one: does Team tier include SSO?", receivedAt: "4d ago" },
        { from: "ari@helix.ai", subject: "Following up on demo", preview: "Loved the agent builder. What's the smallest plan with approvals?", receivedAt: "5d ago" },
      ];
      return { threads, window: `last ${days} days`, query };
    },
  }),
  summarizeDoc: tool({
    description: "Summarize a Notion document by URL into bullet points.",
    inputSchema: z.object({ url: z.string(), focus: z.string().optional() }),
    execute: async ({ url }) => {
      await new Promise((r) => setTimeout(r, 800));
      return {
        url,
        bullets: [
          "Cloud Builds reaches GA with hosted runtime + logs",
          "Approvals v2 adds per-tool risk policies and reviewer rotation",
          "MCP access keys expand to scoped CLI/agent permissions",
          "/docs gets full quickstart, examples, and reference",
          "Target ship: September 30, 2026",
        ],
      };
    },
  }),
  draftDocument: tool({
    description: "Draft a document (contract, email, memo) from a template.",
    inputSchema: z.object({
      template: z.string(),
      title: z.string(),
      recipient: z.string().optional(),
      details: z.string(),
    }),
    execute: async ({ template, title, recipient }) => {
      await new Promise((r) => setTimeout(r, 900));
      const filename = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      return { filename, template, recipient, pages: 3, url: `file://drafts/${filename}` };
    },
  }),
  sendEmail: tool({
    description: "Send an email from the user's Gmail. Use after drafting.",
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      attachments: z.array(z.string()).optional(),
    }),
    execute: async ({ to, subject, attachments }) => {
      await new Promise((r) => setTimeout(r, 700));
      return { delivered: true, to, subject, attachments: attachments ?? [], messageId: `msg_${Math.random().toString(36).slice(2, 10)}` };
    },
  }),
  proposeAgent: tool({
    description:
      "Use this WHEN AND ONLY WHEN the user asks to create / build / set up / make a new agent, automation, scheduled task, daily digest, alert, or recurring workflow. Render a draft agent the user can review, edit, and save. Do NOT call createPlan or updateStep when using this tool — the proposal IS the response.",
    inputSchema: z.object({
      name: z.string().describe("Short human name, e.g. 'Daily Revenue Text'"),
      description: z.string().describe("One-sentence summary of what the agent does"),
      emoji: z.string().describe("Single emoji that fits the agent, e.g. '💸'"),
      schedule: z.object({
        cadence: z.enum(["hourly", "daily", "weekly", "weekdays", "monthly"]),
        timeOfDay: z.string().describe("HH:MM 24h, e.g. '08:00'. Use '08:00' for 'every morning'."),
      }),
      trigger: z.string().describe("Plain-English trigger summary, e.g. 'Every morning at 8:00am'"),
      action: z.string().describe("Plain-English action summary, e.g. 'Send a text message with yesterday's revenue'"),
      dataSources: z.array(z.string()).describe("Where data comes from, e.g. ['Stripe charges (last 24h)']"),
      channel: z.enum(["sms", "email", "slack", "in-app"]),
      recipient: z.string().optional().describe("Phone number, email, or channel — leave blank if unknown"),
      tools: z.array(z.string()).describe("Tool/connector names this agent will use, e.g. ['Stripe', 'Twilio']"),
    }),
    execute: async (input) => ({ ok: true, draft: input }),
  }),
  proposeApi: tool({
    description:
      "Use WHEN AND ONLY WHEN the user asks to create / build / make / spin up / generate an API, endpoint, REST resource, webhook, or backend route. Render a draft API the user can review and save. Do NOT call createPlan, updateStep, or other tools alongside this — the proposal IS the response.",
    inputSchema: z.object({
      name: z.string().describe("Short human name, e.g. 'Tasks API'"),
      description: z.string().describe("One sentence on what the API does"),
      emoji: z.string().describe("Single fitting emoji, e.g. '✅'"),
      kind: z.enum(["rest", "function"]).describe("'rest' = CRUD on a resource (e.g. /api/tasks). 'function' = single custom endpoint (e.g. /api/summarize-url)."),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).describe("Primary method for this endpoint. Use GET for rest list/read."),
      path: z.string().describe("Endpoint path, e.g. '/api/tasks' or '/api/tasks/:id' or '/api/summarize-url'"),
      params: z.array(z.object({
        name: z.string(),
        in: z.enum(["query", "body", "path"]),
        type: z.enum(["string", "number", "boolean", "array", "object"]),
        required: z.boolean(),
        description: z.string(),
        example: z.string().optional(),
      })).describe("Parameters this endpoint accepts. Empty for simple GET list."),
      sampleResponse: z.string().describe("Example JSON response body (stringified). Make it realistic and pretty-printed."),
      endpoints: z.array(z.object({
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
        path: z.string(),
        summary: z.string(),
      })).describe("For 'rest' kind, list 4-5 CRUD endpoints (list/get/create/update/delete). For 'function' kind, just the single endpoint."),
      authentication: z.enum(["none", "api-key", "bearer"]).describe("Auth model. Default to 'api-key' unless the user says public."),
      errors: z.array(z.object({
        status: z.number().describe("HTTP status code"),
        code: z.string().describe("Short error code, e.g. 'not_found'"),
        message: z.string().describe("Plain-English description"),
      })).describe("3-5 realistic error responses (400, 401, 404, 422, 500 as relevant)."),
      docsMarkdown: z.string().describe("Rich markdown documentation (300-700 words). MUST include: ## Overview, ## Authentication, ## Endpoints (with example request and response per endpoint as fenced code blocks), ## Errors, ## Rate limits, ## Changelog. Use realistic content."),
    }),
    execute: async (input) => ({ ok: true, draft: input }),
  }),
  clarify: tool({
    description:
      "Ask the user 1-3 quick clarifying questions BEFORE creating an agent / API / MCP when critical info is missing or ambiguous (e.g. phone number for SMS agent, which metric to track, which data source to read, cadence/time, which workspace to expose). Each question shows a small UI card with multiple-choice options. After calling this, end your response with ONE short plain-text line like 'A few quick questions to get this right.' DO NOT call proposeAgent / proposeApi / proposeMcp in the same response. The user's answers will arrive as the next user message.",
    inputSchema: z.object({
      intent: z.enum(["agent", "api", "mcp"]).describe("What you're about to create"),
      summary: z.string().describe("One sentence on what you're planning to build, e.g. 'Daily SMS with employee effectiveness score'"),
      questions: z.array(z.object({
        id: z.string().describe("kebab-case id, e.g. 'recipient'"),
        question: z.string().describe("Short question, e.g. 'Where should I send it?'"),
        options: z.array(z.object({
          value: z.string().describe("Short value the assistant will see, e.g. 'sms'"),
          label: z.string().describe("Display label, e.g. 'Text my phone'"),
          description: z.string().optional().describe("Optional one-line clarifier"),
        })).min(2).max(5),
        multi: z.boolean().optional().describe("Allow multiple selections. Default false."),
        allowOther: z.boolean().optional().describe("Show a free-text 'Other' option. Default true."),
      })).min(1).max(3),
    }),
    execute: async (input) => ({ ok: true, awaiting: true, draft: input }),
  }),
  proposeMcp: tool({
    description:
      "Use WHEN AND ONLY WHEN the user asks to create / build / make / spin up an MCP, MCP server, Model Context Protocol server, CLI tool, or 'something I can use from Claude Code / Cursor / Codex / my coding tool / terminal' to access their workspace. Render a draft MCP server the user can review and save. Do NOT call createPlan, updateStep, proposeApi, proposeAgent, or other tools alongside this — the proposal IS the response.",
    inputSchema: z.object({
      name: z.string().describe("Short human name, e.g. 'Workspace Brain MCP'"),
      slug: z.string().describe("kebab-case slug used as the server identifier, e.g. 'workspace-brain'"),
      description: z.string().describe("One-sentence summary of what the MCP server exposes"),
      emoji: z.string().describe("Single fitting emoji, e.g. '🧠'"),
      transport: z.enum(["http", "sse", "stdio"]).describe("Default to 'http' (Streamable HTTP) unless the user asks for stdio."),
      tools: z.array(z.object({
        name: z.string().describe("snake_case tool name, e.g. 'search_notion'"),
        description: z.string().describe("One sentence on what the tool does"),
        params: z.array(z.object({
          name: z.string(),
          type: z.enum(["string", "number", "boolean", "array", "object"]),
          required: z.boolean(),
          description: z.string(),
          example: z.string().optional(),
        })),
        sampleResult: z.string().describe("Realistic pretty-printed JSON the tool returns"),
      })).min(3).max(8).describe("3-8 tools the MCP exposes. Pick tools that fit the user's request."),
      resources: z.array(z.object({
        uri: z.string().describe("Resource URI, e.g. 'beevr://docs/handbook'"),
        name: z.string(),
        description: z.string(),
      })).describe("0-4 readable resources the MCP exposes. Use [] if not relevant."),
      docsMarkdown: z.string().describe("Rich markdown docs (300-700 words). MUST include: ## Overview, ## Install (with `claude mcp add`, Cursor settings.json snippet, and an OpenAI Codex / Cline JSON snippet — all using the placeholder URL `https://mcp.beevr.dev/{slug}`), ## Tools (one section per tool with params + example), ## Authentication (Bearer access key), ## Troubleshooting."),
    }),
    execute: async (input) => ({ ok: true, draft: input }),
  }),


};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.MINIMAX_API_KEY;
        if (!key) {
          return new Response(
            "MINIMAX_API_KEY is not configured. Set it in .env (or your Railway service env).",
            { status: 500 },
          );
        }

        const gateway = createMinimaxProvider();
        const model = gateway(DEFAULT_MODEL() || FAST_MODEL());

        const result = streamText({
          model,
          system: [
            "You are Contract Muse — the user's contract-drafting copilot. This is a DEMO environment: every tool always succeeds and returns useful data.",
            "",
            "DEFAULT BEHAVIOR: If the user asks you to DO ANYTHING (find, look up, search, read, summarize, draft, write, send, email, contact, look at, fetch, research, prepare, generate a document) — you MUST use MODE D. Do not reply with plain text describing what you would do. Actually call `createPlan` first, then walk through it with `updateStep` + real tools (searchNotion, searchContacts, searchEmails, summarizeDoc, draftDocument, sendEmail). This is non-negotiable for any task-shaped request, even if it sounds simple.",
            "",
            "FIRST DECIDE which of FIVE modes you are in:",
            "",
            "MODE A — AGENT CREATION. The user asks to create / build / set up / make / schedule a new AGENT, automation, recurring task, daily digest, alert, cron.",
            "- Call `proposeAgent` ONCE with a thoughtful draft. Then ONE short plain-text line like 'Here's a draft — tweak anything and hit Create.' Nothing else.",
            "- DO NOT call createPlan, updateStep, proposeApi, proposeMcp, or other tools.",
            "",
            "MODE B — API CREATION. The user asks to create / build / make / spin up / generate an API, endpoint, REST resource, route, or backend for something.",
            "- Call `proposeApi` ONCE with a complete, thoughtful draft. Pick kind 'rest' if they describe a resource (tasks, users, products → CRUD), 'function' if they describe an action (summarize URL, send SMS, fetch weather).",
            "- For 'rest', fill `endpoints` with the 5 CRUD routes (GET list, GET :id, POST, PUT :id, DELETE :id). For 'function', a single endpoint.",
            "- ALWAYS populate `errors` (3-5 realistic ones) and `docsMarkdown` (full markdown docs as specified — Overview, Authentication, Endpoints with example request/response per endpoint, Errors, Rate limits, Changelog). NEVER ship empty docs.",
            "- Make `sampleResponse` realistic, pretty-printed JSON.",
            "- Then ONE short plain-text line like 'Here's the API — open the playground or docs to test it.' Nothing else.",
            "- DO NOT call createPlan, updateStep, proposeAgent, proposeMcp, or other tools.",
            "",
            "MODE E — MCP CREATION. The user asks to create / build / make / spin up an MCP, MCP server, Model Context Protocol server, or 'something I can connect from Claude Code / Cursor / Codex / my coding tool / CLI / terminal' to interact with their workspace.",
            "- Call `proposeMcp` ONCE with a complete, thoughtful draft (3-8 tools that genuinely fit the user's workspace, plus full `docsMarkdown` with install snippets for Claude Code, Cursor, and Codex/Cline).",
            "- ALWAYS use the placeholder server URL `https://mcp.contractmuse.dev/{slug}` in install snippets.",
            "- Then ONE short plain-text line like 'Here's the MCP — install it in your coding tool and start calling tools.' Nothing else.",
            "- DO NOT call createPlan, updateStep, proposeAgent, proposeApi, or other tools.",
            "",
            "CLARIFICATION RULE (applies to MODE A / B / E): Before proposing an agent, API, or MCP, decide if there's a CRITICAL missing detail you genuinely cannot guess (e.g. SMS but no phone, ambiguous metric source, multiple plausible cadences). If yes, call `clarify` ONCE with 1-3 multiple-choice questions and end your turn with ONE short line. The user's answers will come back as the next message — only THEN call propose*. If you can make a confident assumption with a sensible default, skip clarify and propose directly.",
            "",
            "MODE C — CONVERSATIONAL. Greetings, small talk, thanks, vague non-tasks, meta questions.",
            "- ONE short, warm, plain-text reply (1-2 sentences). For greetings, briefly mention you can search Notion/Gmail, draft docs, send emails, build agents, create APIs, and spin up MCP servers.",
            "",
            "MODE D — OPERATIONAL TASK (DEFAULT for any verb-shaped request like find, look at, draft, send, look up, summarize, research, prepare, contact). NOT recurring, NOT an API/agent/MCP.",
            "- NEVER refuse, NEVER ask follow-ups, NEVER reply with only plain text. Make confident assumptions. Tools always 'worked'. Speak in past tense in the final summary.",
            "- REQUIRED workflow: 1) Call `createPlan` immediately (3-5 parents, 1-3 subs each, kebab-case ids that match what you'll actually do). 2) For EACH step: call `updateStep` with status 'in-progress' BEFORE the work, run the relevant real tool (searchNotion / searchContacts / summarizeDoc / draftDocument / sendEmail / etc.), then call `updateStep` again with status 'done'. 3) Use AT LEAST 2 real data tools. 4) End with a short markdown bullet summary of what got done.",
            "- CITATIONS (REQUIRED): Whenever you reference a fact, doc, email, contact, or generated file in your final summary, cite it inline with a numbered markdown link like `[[1]](notion://acme/handbook/employment)`. Use the EXACT `url` field returned by the tool (notion://, file://, mailto:, etc.) — never invent URLs. Then end with a `**Sources**` section listing each citation. Include sources for: every searchNotion result you used, summarizeDoc URL, searchContacts email (as mailto:), draftDocument file URL, sendEmail messageId. If you didn't actually use a result, don't cite it.",
          ].join("\n"),

          tools,
          stopWhen: stepCountIs(50),
          experimental_transform: smoothStream({ delayInMs: 18, chunking: "word" }),
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onError: (error) => {
            console.error("[api/chat] stream error:", error);
            return error instanceof Error ? error.message : String(error);
          },
        });
      },
    },
  },
});
