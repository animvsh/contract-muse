import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Replaces the Lovable AI Gateway. MiniMax exposes an OpenAI-compatible
// chat completions API, so the same Vercel AI SDK provider works — only the
// baseURL, key, and model names change.
//
// Configure via MINIMAX_API_KEY, MINIMAX_BASE_URL, MINIMAX_MODEL.
// See .env.example.

const DEFAULT_BASE_URL = "https://api.MiniMax.io/v1";

export const createMinimaxProvider = (apiKey?: string, baseURL?: string) =>
  createOpenAICompatible({
    name: "MiniMax",
    apiKey: apiKey ?? process.env.MINIMAX_API_KEY ?? "",
    baseURL: baseURL ?? process.env.MINIMAX_BASE_URL ?? DEFAULT_BASE_URL,
    headers: { "X-Provider": "MiniMax" },
  });

export const DEFAULT_MODEL = () =>
  process.env.MINIMAX_MODEL || "MiniMax-M3";
export const FAST_MODEL = () =>
  process.env.MINIMAX_FAST_MODEL ||
  process.env.MINIMAX_MODEL ||
  "MiniMax-M3";

// Backward-compatible alias — old call sites still import this name.
export const createLovableAiGatewayProvider = (
  _legacyKey: string,
  options?: { apiKey?: string; baseURL?: string; model?: string },
) =>
  createOpenAICompatible({
    name: "MiniMax",
    apiKey: options?.apiKey ?? process.env.MINIMAX_API_KEY ?? "",
    baseURL: options?.baseURL ?? process.env.MINIMAX_BASE_URL ?? DEFAULT_BASE_URL,
    headers: { "X-Provider": "MiniMax" },
  });