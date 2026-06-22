import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Brain,
  Loader2,
  Check,
  ChevronDown,
  FileText,
  Search,
  Mail,
  User,
  FileStack,
  AlertCircle,
  Inbox,
  BookOpen,
  Circle,
  MessageSquare,
  Clock,
  Zap,
  Sparkles,
  Hash,
  Phone,
  Plug,
  Server,
  Code2,
  PlayCircle,
  Paperclip,
  X,
  UploadCloud,
  File as FileIcon,
  Copy,
  Terminal,
  Shield,
  AlertTriangle,
  Layers,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/brain")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: BrainPage,
});

const TOOL_META: Record<
  string,
  { label: string; icon: typeof Search; verb: string }
> = {
  searchNotion: { label: "Notion", icon: FileStack, verb: "Searching Notion" },
  searchContacts: { label: "Contacts", icon: User, verb: "Looking up contact" },
  searchEmails: { label: "Gmail", icon: Inbox, verb: "Searching inbox" },
  summarizeDoc: { label: "Summarize", icon: BookOpen, verb: "Reading document" },
  draftDocument: { label: "Draft", icon: FileText, verb: "Drafting document" },
  sendEmail: { label: "Email", icon: Mail, verb: "Sending email" },
};

type StepStatus = "pending" | "in-progress" | "done" | "warning";
type PlanSubtask = { id: string; title: string; status: StepStatus };
type PlanTask = { id: string; title: string; status: StepStatus; subtasks: PlanSubtask[] };

type AgentDraft = {
  name: string;
  description: string;
  emoji: string;
  schedule: { cadence: "hourly" | "daily" | "weekly" | "weekdays" | "monthly"; timeOfDay: string };
  trigger: string;
  action: string;
  dataSources: string[];
  channel: "sms" | "email" | "slack" | "in-app";
  recipient?: string;
  tools: string[];
};

type ApiParam = {
  name: string;
  in: "query" | "body" | "path";
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
  example?: string;
};
type ApiEndpoint = { method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; path: string; summary: string };
type ApiError = { status: number; code: string; message: string };
type ApiDraft = {
  name: string;
  description: string;
  emoji: string;
  kind: "rest" | "function";
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  params: ApiParam[];
  sampleResponse: string;
  endpoints: ApiEndpoint[];
  authentication?: "none" | "api-key" | "bearer";
  errors?: ApiError[];
  docsMarkdown?: string;
};

type McpToolParam = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
  example?: string;
};
type McpTool = {
  name: string;
  description: string;
  params: McpToolParam[];
  sampleResult: string;
};
type McpResource = { uri: string; name: string; description: string };
type McpDraft = {
  name: string;
  slug: string;
  description: string;
  emoji: string;
  transport: "http" | "sse" | "stdio";
  tools: McpTool[];
  resources: McpResource[];
  docsMarkdown: string;
};

type ClarifyOption = { value: string; label: string; description?: string };
type ClarifyQuestion = { id: string; question: string; options: ClarifyOption[]; multi?: boolean; allowOther?: boolean };
type ClarifyDraft = { intent: "agent" | "api" | "mcp"; summary: string; questions: ClarifyQuestion[] };


type StagedFile = {
  id: string;
  file: File;
  kind: "image" | "text" | "pdf" | "other";
  preview?: string; // data URL for images
  textContent?: string; // for text-like files
};

const TEXT_EXT = /\.(txt|md|markdown|json|csv|tsv|ya?ml|toml|ini|env|log|html?|css|scss|tsx?|jsx?|py|rb|go|rs|java|c|cpp|h|sh|bash|sql|xml|svg)$/i;

function classifyFile(f: File): StagedFile["kind"] {
  if (f.type.startsWith("image/")) return "image";
  if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) return "pdf";
  if (f.type.startsWith("text/") || /^application\/(json|xml|x-yaml|toml)/.test(f.type) || TEXT_EXT.test(f.name)) return "text";
  return "other";
}

function readFileAsDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}
function readFileAsText(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsText(f);
  });
}

async function stageFile(f: File): Promise<StagedFile> {
  const kind = classifyFile(f);
  const id = `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`;
  if (kind === "image") {
    return { id, file: f, kind, preview: await readFileAsDataURL(f) };
  }
  if (kind === "text") {
    const text = await readFileAsText(f);
    return { id, file: f, kind, textContent: text.slice(0, 60_000) };
  }
  return { id, file: f, kind };
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function BrainPage() {
  const { q } = Route.useSearch();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<StagedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (e) => toast.error(e.message || "Chat error"),
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage({ text: q });
    }
  }, [q, sendMessage]);

  const stickToBottom = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = distance < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 10);
    const accepted: StagedFile[] = [];
    for (const f of arr) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is over 20MB`);
        continue;
      }
      try {
        accepted.push(await stageFile(f));
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
    if (accepted.length) {
      setPending((p) => [...p, ...accepted].slice(0, 10));
      toast.success(`Attached ${accepted.length} file${accepted.length > 1 ? "s" : ""}`);
    }
  };

  const removePending = (id: string) => setPending((p) => p.filter((f) => f.id !== id));

  const handleSend = () => {
    if ((!input.trim() && pending.length === 0) || isLoading) return;

    // Build text: append text-file contents inline so the model can reference them.
    const textParts: string[] = [];
    if (input.trim()) textParts.push(input.trim());
    for (const sf of pending) {
      if (sf.kind === "text" && sf.textContent) {
        textParts.push(`\n\n--- File: ${sf.file.name} (${formatBytes(sf.file.size)}) ---\n${sf.textContent}\n--- end of ${sf.file.name} ---`);
      } else if (sf.kind === "pdf") {
        textParts.push(`\n[Attached PDF: ${sf.file.name} (${formatBytes(sf.file.size)})]`);
      } else if (sf.kind === "other") {
        textParts.push(`\n[Attached file: ${sf.file.name} (${sf.file.type || "unknown"}, ${formatBytes(sf.file.size)})]`);
      }
    }

    // Image file parts go to the model as multimodal content.
    const fileParts = pending
      .filter((sf) => sf.kind === "image" && sf.preview)
      .map((sf) => ({
        type: "file" as const,
        mediaType: sf.file.type || "image/png",
        url: sf.preview!,
        filename: sf.file.name,
      }));

    sendMessage({
      text: textParts.join("") || " ",
      files: fileParts.length ? fileParts : undefined,
    });
    setInput("");
    setPending([]);
  };

  const onDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      onDragEnter={onDragEnter}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="animate-pop flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-white/90 px-10 py-8 shadow-xl">
            <UploadCloud className="h-10 w-10 text-primary" />
            <div className="text-base font-medium text-foreground">Drop to attach</div>
            <div className="text-xs text-muted-foreground">Images, PDFs, text and code files · up to 20MB each</div>
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className={`mx-auto w-full max-w-3xl px-6 ${isEmpty ? "flex min-h-full flex-col justify-center pb-32 pt-8" : "pb-40 pt-10"}`}>
          {isEmpty && (
            <div className="animate-[fadeInUp_300ms_ease-out]">
              <div className="float-y wobble-hover mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Brain className="h-7 w-7" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Ask your company brain</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Connected to Notion, Gmail contacts, document drafting, and email. Drag and drop files to reference them.
              </p>
              <div className="stagger mt-8 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  "Look at the doc about Beevr and send Adithya an employment contract",
                  "Find the Q3 roadmap in Notion and summarize it",
                  "Draft a follow-up email to the latest customer thread",
                  "Who emailed me about pricing this week?",
                ].map((s, i) => (
                  <button
                    key={s}
                    onClick={() => sendMessage({ text: s })}
                    style={{ ['--i' as never]: i }}
                    className="clicky alive slide-in-right group rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-left leading-snug text-foreground/80 shadow-sm backdrop-blur transition-all hover:border-primary/30 hover:bg-white hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} msg={msg} />
              ) : (
                <AssistantMessage key={msg.id} msg={msg} onSend={(text) => sendMessage({ text })} />
              ),
            )}
            {status === "submitted" && (
              <div className="animate-pop flex gap-3">
                <div className="ring-pulse float-y flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  <span className="shimmer-text caret">Thinking</span>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="h-4 bg-white" />
        <div className="pointer-events-auto bg-white/80 px-6 pb-5 pt-2 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl">
            {pending.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pending.map((sf) => (
                  <div
                    key={sf.id}
                    className="animate-pop group relative flex items-center gap-2 rounded-xl border border-black/10 bg-white py-1.5 pl-1.5 pr-2 shadow-sm"
                  >
                    {sf.kind === "image" && sf.preview ? (
                      <img src={sf.preview} alt={sf.file.name} className="h-9 w-9 rounded-md object-cover" />
                    ) : (
                      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${sf.kind === "pdf" ? "bg-rose-500/10 text-rose-600" : sf.kind === "text" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                        {sf.kind === "pdf" ? <FileText className="h-4 w-4" /> : sf.kind === "text" ? <Code2 className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="max-w-[180px] truncate text-xs font-medium text-foreground">{sf.file.name}</div>
                      <div className="text-[10px] text-muted-foreground">{formatBytes(sf.file.size)}</div>
                    </div>
                    <button
                      onClick={() => removePending(sf.id)}
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-lg shadow-black/5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="clicky-sm flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Attach files"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files);
                  if (files.length) {
                    e.preventDefault();
                    addFiles(files);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask anything · drag, drop or paste files"
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && pending.length === 0)}
                className="clicky clicky-sm flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-40"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
              Enter to send · Shift + Enter newline · Drop or paste files to attach
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

function UserMessage({ msg }: { msg: UIMsg }) {
  const text = msg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
  const files = msg.parts.filter((p) => p.type === "file") as Array<{
    type: "file";
    mediaType?: string;
    url: string;
    filename?: string;
  }>;
  // Hide raw inline file dumps from the bubble (they were prepended for the model).
  const visibleText = text.replace(/\n*--- File: [\s\S]*?--- end of [^\n]+---/g, "").replace(/\n\[Attached (PDF|file): [^\]]+\]/g, "").trim();

  return (
    <div className="flex justify-end">
      <div className="slide-in-right max-w-[80%] space-y-2">
        {files.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {files.map((f, i) =>
              f.mediaType?.startsWith("image/") ? (
                <img
                  key={i}
                  src={f.url}
                  alt={f.filename ?? "attachment"}
                  className="max-h-48 max-w-[240px] rounded-xl border border-black/10 object-cover shadow-sm"
                />
              ) : (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-sm">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="max-w-[160px] truncate font-medium text-foreground">{f.filename ?? "file"}</span>
                </div>
              ),
            )}
          </div>
        )}
        {visibleText && (
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-sm">
            {visibleText}
          </div>
        )}
      </div>
    </div>
  );
}

type UIMsg = ReturnType<typeof useChat>["messages"][number];

type ToolPartShape = {
  type: string;
  toolCallId?: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function AssistantMessage({ msg, onSend }: { msg: UIMsg; onSend: (text: string) => void }) {
  // Build the live plan + ordered render units from message parts
  const plan: PlanTask[] = [];
  const taskIndex = new Map<string, PlanTask>();
  const subtaskIndex = new Map<string, { task: PlanTask; sub: PlanSubtask }>();

  type Unit =
    | { kind: "text"; key: string; text: string }
    | { kind: "tool"; key: string; part: ToolPartShape }
    | { kind: "agent"; key: string; draft: AgentDraft }
    | { kind: "api"; key: string; draft: ApiDraft }
    | { kind: "mcp"; key: string; draft: McpDraft }
    | { kind: "clarify"; key: string; draft: ClarifyDraft }
    | { kind: "plan"; key: string; snapshot: PlanTask[]; running: boolean };


  const units: Unit[] = [];
  let planIntroduced = false;

  msg.parts.forEach((part, idx) => {
    if (part.type === "text") {
      units.push({ kind: "text", key: `t${idx}`, text: part.text });
      return;
    }
    if (!part.type.startsWith("tool-")) return;
    const tp = part as ToolPartShape;
    const name = tp.type.replace(/^tool-/, "");

    if (name === "proposeAgent") {
      const input = tp.input as AgentDraft | undefined;
      if (input && input.name) {
        units.push({ kind: "agent", key: `a${idx}`, draft: input });
      }
      return;
    }

    if (name === "proposeApi") {
      const input = tp.input as ApiDraft | undefined;
      if (input && input.name) {
        units.push({ kind: "api", key: `api${idx}`, draft: input });
      }
      return;
    }

    if (name === "proposeMcp") {
      const input = tp.input as McpDraft | undefined;
      if (input && input.name) {
        units.push({ kind: "mcp", key: `mcp${idx}`, draft: input });
      }
      return;
    }

    if (name === "clarify") {
      const input = tp.input as ClarifyDraft | undefined;
      if (input && Array.isArray(input.questions) && input.questions.length > 0) {
        units.push({ kind: "clarify", key: `c${idx}`, draft: input });
      }
      return;
    }

    if (name === "createPlan") {
      const input = tp.input as { tasks?: PlanTask[] } | undefined;
      const tasks = input?.tasks ?? [];
      tasks.forEach((t) => {
        const task: PlanTask = {
          id: t.id,
          title: t.title,
          status: "pending",
          subtasks: (t.subtasks ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            status: "pending",
          })),
        };
        plan.push(task);
        taskIndex.set(task.id, task);
        task.subtasks.forEach((s) => subtaskIndex.set(s.id, { task, sub: s }));
      });
      if (!planIntroduced && plan.length > 0) {
        planIntroduced = true;
        units.push({ kind: "plan", key: "plan", snapshot: [], running: true });
      }
      return;
    }

    if (name === "updateStep") {
      const input = tp.input as { id?: string; status?: StepStatus } | undefined;
      if (input?.id && input.status) {
        const t = taskIndex.get(input.id);
        if (t) t.status = input.status;
        const s = subtaskIndex.get(input.id);
        if (s) s.sub.status = input.status;
      }
      return;
    }

    units.push({ kind: "tool", key: `x${idx}`, part: tp });
  });

  // Snapshot the final plan into the placeholder unit
  const planUnit = units.find((u) => u.kind === "plan");
  if (planUnit && planUnit.kind === "plan") {
    planUnit.snapshot = JSON.parse(JSON.stringify(plan)) as PlanTask[];
    const allDone = plan.length > 0 && plan.every(
      (t) => t.status === "done" || t.status === "warning",
    );
    planUnit.running = !allDone;
  }

  return (
    <div className="flex gap-3">
      <div className="wobble-hover flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Brain className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {units.map((u) => {
          if (u.kind === "text") {
            return (
              <div key={u.key} className="slide-in-left rounded-2xl rounded-tl-md border border-black/5 bg-white/80 px-5 py-3.5 text-[15px] leading-relaxed text-foreground shadow-sm backdrop-blur markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{u.text}</ReactMarkdown>
              </div>
            );
          }
          if (u.kind === "plan") {
            return <PlanBlock key={u.key} tasks={u.snapshot} running={u.running} />;
          }
          if (u.kind === "agent") {
            return <AgentProposalCard key={u.key} draft={u.draft} />;
          }
          if (u.kind === "api") {
            return <ApiProposalCard key={u.key} draft={u.draft} />;
          }
          if (u.kind === "mcp") {
            return <McpProposalCard key={u.key} draft={u.draft} />;
          }
          if (u.kind === "clarify") {
            return <ClarifyCard key={u.key} draft={u.draft} onSend={onSend} />;
          }
          if (u.kind === "tool") {
            return <ToolPart key={u.key} part={u.part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600">
        <AlertCircle className="h-3 w-3" />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/70" style={{ animationDuration: "3s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center text-muted-foreground/50">
      <Circle className="h-4 w-4" />
    </span>
  );
}

function StatusBadge({ status, count }: { status: StepStatus; count?: number }) {
  const map: Record<StepStatus, string> = {
    "in-progress": "bg-primary/10 text-primary border-primary/20",
    done: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    pending: "bg-muted text-muted-foreground border-border",
  };
  const label = status === "pending" ? "pending" : status;
  return (
    <span className="flex items-center gap-1.5">
      {count !== undefined && count > 0 && (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
        {label}
      </span>
    </span>
  );
}

function PlanBlock({ tasks, running }: { tasks: PlanTask[]; running: boolean }) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="shimmer-text">Drafting plan…</span>
      </div>
    );
  }
  return (
    <div className="animate-pop overflow-hidden rounded-2xl border border-black/10 bg-white/90 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-col">
        {tasks.map((task, ti) => {
          const pendingSubs = task.subtasks.filter((s) => s.status === "pending").length;
          return (
            <div key={task.id} className={`group/row px-3 py-3 ${ti > 0 ? "border-t border-black/5" : ""}`}>
              <div className="flex items-center gap-3">
                <StatusIcon status={task.status} />
                <span className={`flex-1 text-[15px] font-medium ${task.status === "done" ? "text-foreground/60" : "text-foreground"}`}>
                  {task.title}
                </span>
                <StatusBadge status={task.status} count={task.status === "pending" ? pendingSubs : undefined} />
              </div>
              {task.subtasks.length > 0 && (task.status === "in-progress" || task.subtasks.some((s) => s.status !== "pending")) && (
                <div className="relative mt-2.5 ml-2.5 space-y-2 border-l border-dashed border-black/15 pl-5">
                  {task.subtasks.map((sub) => (
                    <div key={sub.id} className="animate-[fadeInUp_240ms_ease-out] flex items-center gap-2.5">
                      <StatusIcon status={sub.status} />
                      <span className={`text-[14px] ${
                        sub.status === "done"
                          ? "text-muted-foreground line-through"
                          : sub.status === "in-progress"
                            ? "text-foreground"
                            : "text-foreground/80"
                      }`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {running && (
        <div className="mt-1 flex items-center gap-2 border-t border-black/5 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="shimmer-text">Working through plan…</span>
        </div>
      )}
    </div>
  );
}

function ToolPart({ part }: { part: ToolPartShape }) {
  const [open, setOpen] = useState(false);
  const toolName = part.type.replace(/^tool-/, "");
  const meta = TOOL_META[toolName] ?? {
    label: toolName,
    icon: Search,
    verb: toolName,
  };
  const Icon = meta.icon;
  const isRunning =
    part.state === "input-streaming" || part.state === "input-available";
  const isError = part.state === "output-error";
  const isDone = part.state === "output-available";

  return (
    <div className={`animate-pop overflow-hidden rounded-lg border bg-muted/40 transition-colors ${isRunning ? "border-primary/40" : "border-border"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="clicky-sm flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/70 active:bg-muted"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md ${
            isDone
              ? "bg-accent text-primary"
              : isError
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/15 text-primary"
          }`}
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : isDone ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="flex-1 truncate">
          <span className="font-medium text-foreground">{meta.label}</span>
          <span className="ml-2 text-muted-foreground">
            {isRunning
              ? `${meta.verb}…`
              : isError
                ? "Failed"
                : summarizeInput(toolName, part.input)}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="space-y-2 border-t border-border px-3 py-2 text-xs">
          {part.input !== undefined && (
            <div>
              <div className="mb-1 font-medium text-muted-foreground">Input</div>
              <pre className="overflow-x-auto rounded bg-background p-2 text-foreground">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {part.output !== undefined && (
            <div>
              <div className="mb-1 font-medium text-muted-foreground">Output</div>
              <pre className="overflow-x-auto rounded bg-background p-2 text-foreground">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
          {part.errorText && (
            <div className="text-destructive">{part.errorText}</div>
          )}
        </div>
      )}
    </div>
  );
}

function summarizeInput(name: string, input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const i = input as Record<string, unknown>;
  if (name === "searchNotion") return `"${i.query}"`;
  if (name === "searchEmails") return `"${i.query}"`;
  if (name === "searchContacts") return `"${i.name}"`;
  if (name === "summarizeDoc") return `${i.url}`;
  if (name === "draftDocument") return `${i.title}`;
  if (name === "sendEmail") return `→ ${i.to}`;
  return "";
}

const CHANNEL_META: Record<AgentDraft["channel"], { label: string; icon: typeof Phone; tone: string }> = {
  sms: { label: "Text message", icon: Phone, tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  email: { label: "Email", icon: Mail, tone: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  slack: { label: "Slack", icon: Hash, tone: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  "in-app": { label: "In-app notification", icon: MessageSquare, tone: "bg-primary/10 text-primary border-primary/20" },
};

const CADENCE_LABEL: Record<AgentDraft["schedule"]["cadence"], string> = {
  hourly: "Every hour",
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Every week",
  monthly: "Every month",
};

type BuildStep = {
  id: string;
  label: string;
  detail?: string;
  status: "pending" | "running" | "done";
  durationMs: number;
};

function buildPlan(d: AgentDraft): BuildStep[] {
  const steps: BuildStep[] = [
    { id: "validate", label: "Validating spec", detail: `${d.name} · ${d.emoji}`, status: "pending", durationMs: 380 },
    { id: "compile", label: "Compiling agent definition", detail: "writing manifest.json", status: "pending", durationMs: 520 },
  ];
  for (const src of (d.dataSources ?? []).slice(0, 3)) {
    const head = src.split(/[ (]/)[0];
    steps.push({ id: `src-${head}`, label: `Connecting to ${head}`, detail: src, status: "pending", durationMs: 600 + Math.random() * 400 });
  }
  for (const t of (d.tools ?? []).slice(0, 3)) {
    steps.push({ id: `tool-${t}`, label: `Authorizing ${t}`, detail: "OAuth scope verified", status: "pending", durationMs: 450 + Math.random() * 300 });
  }
  steps.push(
    { id: "trigger", label: `Scheduling ${CADENCE_LABEL[d.schedule.cadence].toLowerCase()} trigger`, detail: `fires at ${d.schedule.timeOfDay}`, status: "pending", durationMs: 480 },
    { id: "delivery", label: `Wiring ${CHANNEL_META[d.channel].label.toLowerCase()} delivery`, detail: d.recipient || "default workspace channel", status: "pending", durationMs: 520 },
    { id: "dryrun", label: "Running first dry-run", detail: "simulating tomorrow's execution", status: "pending", durationMs: 850 },
    { id: "deploy", label: "Deploying to Beevr runtime", detail: "edge worker provisioned", status: "pending", durationMs: 700 },
  );
  return steps;
}

function agentDraftToWorkflowSpec(d: AgentDraft) {
  const cadence = CADENCE_LABEL[d.schedule.cadence] ?? "On schedule";
  const trigger = { type: "schedule", description: `${cadence} at ${d.schedule.timeOfDay}` };
  const steps = [
    ...(d.dataSources ?? []).map((src) => {
      const integration = src.split(/[ (]/)[0] || "Source";
      return { title: `Read from ${integration}`, integration, action: src };
    }),
    ...(d.tools ?? []).map((tool) => ({ title: `Use ${tool}`, integration: tool, action: `Call ${tool} API` })),
    {
      title: `Send via ${CHANNEL_META[d.channel].label}`,
      integration: d.channel === "sms" ? "Twilio" : d.channel === "email" ? "Gmail" : d.channel === "slack" ? "Slack" : "Beevr",
      action: d.recipient ? `${d.action || "Deliver update"} → ${d.recipient}` : d.action || "Deliver update",
    },
  ];

  return { name: d.name, description: d.description, emoji: d.emoji, trigger, steps };
}

function normalizeAgentDraft(input: Partial<AgentDraft> | undefined | null): AgentDraft {
  const src = (input ?? {}) as Partial<AgentDraft>;
  const cadence = src.schedule?.cadence ?? "daily";
  const channel = (src.channel && CHANNEL_META[src.channel as AgentDraft["channel"]]) ? src.channel as AgentDraft["channel"] : "in-app";
  return {
    name: src.name ?? "Untitled agent",
    description: src.description ?? "",
    emoji: src.emoji ?? "🤖",
    schedule: { cadence, timeOfDay: src.schedule?.timeOfDay ?? "09:00" },
    trigger: src.trigger ?? "On schedule",
    action: src.action ?? "",
    dataSources: Array.isArray(src.dataSources) ? src.dataSources : [],
    channel,
    recipient: src.recipient,
    tools: Array.isArray(src.tools) ? src.tools : [],
  };
}

function AgentProposalCard({ draft }: { draft: AgentDraft }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<{ id: string } | null>(null);
  const [d, setD] = useState<AgentDraft>(() => normalizeAgentDraft(draft));
  const [building, setBuilding] = useState(false);
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const channel = CHANNEL_META[d.channel] ?? CHANNEL_META["in-app"];
  const ChannelIcon = channel.icon;

  const update = <K extends keyof AgentDraft>(k: K, v: AgentDraft[K]) =>
    setD((cur) => ({ ...cur, [k]: v }));

  const runBuild = async () => {
    setEditing(false);
    setBuilding(true);
    const plan = buildPlan(d);
    setSteps(plan);

    for (let i = 0; i < plan.length; i++) {
      setSteps((cur) => cur.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
      await new Promise((r) => setTimeout(r, plan[i].durationMs));
      setSteps((cur) => cur.map((s, idx) => (idx === i ? { ...s, status: "done" } : s)));
    }

    try {
      const { data: userRes } = await supabase.auth.getCurrentUser();
      const user = userRes.user;
      if (!user) throw new Error("Sign in required");
      const { data: row, error } = await supabase
        .from("agents")
        .insert({
          name: d.name,
          description: d.description,
          status: "active",
          spec: agentDraftToWorkflowSpec(d) as never,
          user_id: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      setSaved({ id: row.id });
      toast.success(`${d.emoji} ${d.name} deployed`, { description: `${d.trigger} · ${d.action}` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save agent");
      setBuilding(false);
    }
  };

  if (saved) {
    return (
      <div className="animate-pop relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white text-lg">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{d.emoji}</span>
              <h3 className="text-base font-semibold">{d.name} is live</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {d.trigger.toLowerCase()} · {d.action.toLowerCase()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigate({ to: "/app/agents/$id", params: { id: saved.id } })}
                className="clicky-sm inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-black/[0.03]"
              >
                Open agent <ChevronDown className="h-3 w-3 -rotate-90" />
              </button>
              <button
                onClick={() => navigate({ to: "/app/agents" })}
                className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                See all agents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (building) {
    const doneCount = steps.filter((s) => s.status === "done").length;
    const pct = Math.round((doneCount / steps.length) * 100);
    return (
      <div className="animate-pop relative overflow-hidden rounded-2xl border border-primary/25 bg-white">
        <div className="relative px-5 pt-5 pb-3">
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 animate-pulse rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl shadow-lg shadow-primary/20">
              <span aria-hidden>{d.emoji}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Building agent
              </div>
              <h3 className="mt-0.5 truncate text-base font-semibold">{d.name}</h3>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-black/5 bg-muted/20 p-4">
          <ol className="space-y-1">
            {steps.map((s) => (
              <li
                key={s.id}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                  s.status === "running" ? "bg-primary/5" : ""
                }`}
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center">
                  {s.status === "done" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
                  ) : s.status === "running" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-2 w-2 text-muted-foreground/40" strokeWidth={3} />
                  )}
                </span>
                <span
                  className={`font-medium ${
                    s.status === "done"
                      ? "text-foreground"
                      : s.status === "running"
                      ? "text-foreground"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {s.label}
                </span>
                {s.detail && s.status !== "pending" && (
                  <span className="ml-auto truncate text-[11px] font-mono text-muted-foreground">
                    {s.detail}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pop relative overflow-hidden rounded-2xl border border-primary/20 bg-white">
      {/* Glow header */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl shadow-lg shadow-primary/20">
            <span aria-hidden>{d.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Agent draft · review & edit
            </div>
            {editing ? (
              <input
                value={d.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-0.5 w-full rounded-md border border-black/10 bg-white px-2 py-1 text-base font-semibold outline-none focus:border-primary"
              />
            ) : (
              <h3 className="mt-0.5 truncate text-base font-semibold">{d.name}</h3>
            )}
            {editing ? (
              <textarea
                value={d.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-none rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
              />
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">{d.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="grid divide-y divide-black/5 border-t border-black/5 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">When</div>
            {editing ? (
              <div className="mt-1 flex gap-1.5">
                <select
                  value={d.schedule.cadence}
                  onChange={(e) => update("schedule", { ...d.schedule, cadence: e.target.value as AgentDraft["schedule"]["cadence"] })}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                >
                  {Object.entries(CADENCE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={d.schedule.timeOfDay}
                  onChange={(e) => update("schedule", { ...d.schedule, timeOfDay: e.target.value })}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : (
              <div className="mt-0.5 text-sm font-medium">
                {CADENCE_LABEL[d.schedule.cadence]} at {d.schedule.timeOfDay}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4">
          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${channel.tone}`}>
            <ChannelIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Send via</div>
            {editing ? (
              <div className="mt-1 flex flex-col gap-1.5">
                <select
                  value={d.channel}
                  onChange={(e) => update("channel", e.target.value as AgentDraft["channel"])}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                >
                  {Object.entries(CHANNEL_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input
                  placeholder={d.channel === "sms" ? "+1 555 0123" : d.channel === "email" ? "you@company.com" : "#channel"}
                  value={d.recipient ?? ""}
                  onChange={(e) => update("recipient", e.target.value)}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : (
              <div className="mt-0.5 text-sm font-medium">
                {channel.label}
                {d.recipient && <span className="ml-1 text-muted-foreground">→ {d.recipient}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 sm:col-span-2 sm:border-t sm:border-black/5">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What it does</div>
            {editing ? (
              <textarea
                value={d.action}
                onChange={(e) => update("action", e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
              />
            ) : (
              <div className="mt-0.5 text-sm">{d.action}</div>
            )}
            {(d.dataSources?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(d.dataSources ?? []).map((src) => (
                  <span key={src} className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                    <Plug className="h-2.5 w-2.5" /> {src}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-black/5 bg-muted/30 px-4 py-3">
        <button
          onClick={() => setEditing((v) => !v)}
          className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-black/5 hover:text-foreground"
        >
          {editing ? "Done editing" : "Edit details"}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Discarded draft")}
            className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-black/5"
          >
            Dismiss
          </button>
          <button
            onClick={runBuild}
            className="clicky inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Approve & build
          </button>
        </div>
      </div>
    </div>
  );
}

const METHOD_TONE: Record<ApiEndpoint["method"], string> = {
  GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  POST: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  PUT: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PATCH: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  DELETE: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="clicky-sm inline-flex items-center gap-1 rounded-md border border-black/10 bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-black/20"
      title={label}
    >
      {copied ? <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} /> : <Copy className="h-2.5 w-2.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function DocsMarkdown({ md }: { md: string }) {
  return (
    <div className="markdown-body max-w-none px-5 py-4 text-[13.5px] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
}

function prettifyJson(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}

function ApiProposalCard({ draft }: { draft: ApiDraft }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ id: string } | null>(null);
  const [tab, setTab] = useState<"overview" | "sample" | "docs">("overview");
  if (!draft || !draft.name) return null;

  const save = async () => {
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getCurrentUser();
      const user = userRes.user;
      if (!user) throw new Error("Sign in required");
      const { data: row, error } = await supabase
        .from("apis")
        .insert({
          user_id: user.id,
          name: draft.name,
          slug: slugify(draft.name) || "api",
          description: draft.description,
          emoji: draft.emoji,
          kind: draft.kind,
          method: draft.method,
          path: draft.path,
          spec: draft as never,
        })
        .select("id")
        .single();
      if (error) throw error;
      setSaved({ id: row.id });
      toast.success(`${draft.emoji} ${draft.name} created`, { description: `${draft.method} ${draft.path}` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save API");
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <div className="animate-pop rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{draft.emoji}</span>
              <h3 className="text-base font-semibold">{draft.name} is live</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{draft.method} {draft.path}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigate({ to: "/app/apis/$id", params: { id: saved.id } })}
                className="clicky-sm inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <PlayCircle className="h-3.5 w-3.5" /> Open playground
              </button>
              <button
                onClick={() => navigate({ to: "/app/apis" })}
                className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                See all APIs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const endpoints = draft.endpoints?.length ? draft.endpoints : [{ method: draft.method, path: draft.path, summary: draft.description }];
  const baseUrl = `https://api.beevr.dev/${slugify(draft.name) || "api"}`;
  const fullUrl = `${baseUrl}${draft.path}`;
  const auth = draft.authentication ?? "bearer";

  return (
    <div className="animate-pop relative overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-2xl">
            <span aria-hidden>{draft.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              <Server className="h-3 w-3" /> New API draft
              <span className="rounded-full border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9.5px] tracking-wider">
                {draft.kind === "rest" ? "REST" : "Function"}
              </span>
              <span className="rounded-full border border-black/10 bg-muted/40 px-1.5 py-0.5 text-[9.5px] tracking-wider text-muted-foreground">
                <Shield className="mr-0.5 inline h-2.5 w-2.5" />
                {auth === "none" ? "Public" : auth === "api-key" ? "API Key" : "Bearer"}
              </span>
            </div>
            <h3 className="mt-1 truncate text-[17px] font-display font-semibold tracking-tight">{draft.name}</h3>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{draft.description}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-black/5 bg-muted/30 px-2 py-1.5">
              <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[draft.method] ?? ""}`}>
                {draft.method}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground">{fullUrl}</code>
              <CopyButton text={fullUrl} label="" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-y border-black/5 bg-muted/20 px-3">
        {([
          ["overview", "Overview", Layers],
          ["sample", "Sample", Code2],
          ["docs", "Docs", FileText],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] font-medium transition ${tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-3 w-3" /> {label}
            {tab === id && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Endpoints</div>
            <div className="space-y-1.5">
              {endpoints.slice(0, 8).map((ep, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-2.5 py-1.5 text-xs">
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${METHOD_TONE[ep.method] ?? ""}`}>
                    {ep.method}
                  </span>
                  <code className="shrink-0 font-mono text-foreground">{ep.path}</code>
                  <span className="ml-auto truncate text-muted-foreground">{ep.summary}</span>
                </div>
              ))}
            </div>
          </div>

          {(draft.params?.length ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Parameters</div>
              <div className="overflow-hidden rounded-lg border border-black/5">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-2.5 py-1.5 font-medium">Name</th>
                      <th className="px-2.5 py-1.5 font-medium">In</th>
                      <th className="px-2.5 py-1.5 font-medium">Type</th>
                      <th className="px-2.5 py-1.5 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(draft.params ?? []).slice(0, 10).map((p) => (
                      <tr key={p.name} className="border-t border-black/5">
                        <td className="px-2.5 py-1.5 font-mono">
                          {p.name}
                          {p.required && <span className="ml-0.5 text-rose-600">*</span>}
                        </td>
                        <td className="px-2.5 py-1.5 text-muted-foreground">{p.in}</td>
                        <td className="px-2.5 py-1.5 text-muted-foreground">{p.type}</td>
                        <td className="px-2.5 py-1.5 text-muted-foreground">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(draft.errors?.length ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <AlertTriangle className="h-3 w-3" /> Errors
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(draft.errors ?? []).map((e) => (
                  <span key={e.code} className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 text-[11px]">
                    <code className="font-mono font-semibold text-rose-700">{e.status}</code>
                    <code className="font-mono text-muted-foreground">{e.code}</code>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "sample" && (
        <div className="p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Sample response</span>
            <CopyButton text={prettifyJson(draft.sampleResponse ?? "{}")} />
          </div>
          <pre className="overflow-auto rounded-xl bg-[oklch(0.18_0_0)] p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
{prettifyJson(draft.sampleResponse ?? "{}")}
          </pre>
        </div>
      )}

      {tab === "docs" && (
        draft.docsMarkdown
          ? <DocsMarkdown md={draft.docsMarkdown} />
          : <div className="p-6 text-center text-xs text-muted-foreground">No documentation generated.</div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-black/5 bg-muted/20 px-4 py-3">
        <span className="text-[11px] text-muted-foreground">Mock API — playground returns the sample response.</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Discarded draft")}
            className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-black/5"
          >
            Dismiss
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="clicky inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? "Creating…" : "Create API"}
          </button>
        </div>
      </div>
    </div>
  );
}

function McpProposalCard({ draft }: { draft: McpDraft }) {
  const tools = Array.isArray(draft?.tools) ? draft.tools : [];
  const resources = Array.isArray(draft?.resources) ? draft.resources : [];
  const transport = draft?.transport || "http";
  const emoji = draft?.emoji || "🧩";
  const name = draft?.name || "Untitled MCP";
  const description = draft?.description || "Mock MCP server generated for your workspace.";
  const slug = (draft.slug || slugify(name) || "mcp").toLowerCase();
  const url = `https://mcp.beevr.dev/${slug}`;

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"tools" | "install" | "docs">("tools");
  const [openTool, setOpenTool] = useState<number | null>(0);
  const [client, setClient] = useState<"claude" | "cursor" | "codex">("claude");

  const save = async () => {
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getCurrentUser();
      const user = userRes.user;
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("mcps").insert({
        user_id: user.id,
        name,
        slug,
        description,
        emoji,
        spec: { ...draft, tools, resources, transport } as never,
      });
      if (error) throw error;
      setSaved(true);
      toast.success(`${emoji} ${name} installed`, {
        description: `mcp.beevr.dev/${slug} — ${tools.length} tools`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save MCP");
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <div className="animate-pop rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{emoji}</span>
              <h3 className="text-base font-semibold">{name} is live</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Connect from Claude Code, Cursor or Codex with the URL below.</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-black/5 bg-white px-2 py-1.5">
              <code className="flex-1 font-mono text-[11px]">{url}</code>
              <CopyButton text={url} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const installSnippet = client === "claude"
    ? `claude mcp add ${slug} --transport ${transport} ${url}`
    : client === "cursor"
    ? `{
  "mcpServers": {
    "${slug}": {
      "url": "${url}",
      "transport": "${transport}"
    }
  }
}`
    : `{
  "name": "${slug}",
  "type": "${transport}",
  "url": "${url}"
}`;

  return (
    <div className="animate-pop relative overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-2xl">
            <span aria-hidden>{emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              <Plug className="h-3 w-3" /> New MCP draft
              <span className="rounded-full border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9.5px] tracking-wider">
                {transport.toUpperCase()}
              </span>
              <span className="rounded-full border border-black/10 bg-muted/40 px-1.5 py-0.5 text-[9.5px] tracking-wider text-muted-foreground">
                {tools.length} tools
              </span>
              {resources.length > 0 && (
                <span className="rounded-full border border-black/10 bg-muted/40 px-1.5 py-0.5 text-[9.5px] tracking-wider text-muted-foreground">
                  {resources.length} resources
                </span>
              )}
            </div>
            <h3 className="mt-1 truncate text-[17px] font-display font-semibold tracking-tight">{name}</h3>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{description}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-black/5 bg-muted/30 px-2 py-1.5">
              <Plug className="h-3 w-3 shrink-0 text-primary" />
              <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground">{url}</code>
              <CopyButton text={url} label="" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-y border-black/5 bg-muted/20 px-3">
        {([
          ["tools", "Tools", Code2],
          ["install", "Install", Terminal],
          ["docs", "Docs", FileText],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] font-medium transition ${tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-3 w-3" /> {label}
            {tab === id && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "tools" && (
        <div className="space-y-3 p-4">
          {tools.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/10 bg-white px-3 py-4 text-center text-[11px] text-muted-foreground">
              No tools defined yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {tools.map((t, i) => {
                const params = Array.isArray(t?.params) ? t.params : [];
                return (
                  <div key={t.name ?? i} className="overflow-hidden rounded-lg border border-black/5 bg-white">
                    <button
                      onClick={() => setOpenTool(openTool === i ? null : i)}
                      className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs hover:bg-muted/30"
                    >
                      <Code2 className="h-3 w-3 shrink-0 text-primary" />
                      <code className="font-mono font-semibold">{t.name}</code>
                      <span className="ml-2 truncate text-muted-foreground">{t.description}</span>
                      <ChevronDown className={`ml-auto h-3 w-3 shrink-0 text-muted-foreground transition-transform ${openTool === i ? "rotate-180" : ""}`} />
                    </button>
                    {openTool === i && (
                      <div className="border-t border-black/5 bg-muted/10 p-3 text-[11px]">
                        {params.length > 0 && (
                          <div className="mb-2">
                            <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Parameters</div>
                            <div className="flex flex-wrap gap-1">
                              {params.map((p) => (
                                <span key={p.name} className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-1.5 py-0.5">
                                  <code className="font-mono">{p.name}</code>
                                  <span className="text-muted-foreground">{p.type}</span>
                                  {p.required && <span className="text-rose-600">*</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Sample result</span>
                          <CopyButton text={prettifyJson(t.sampleResult ?? "{}")} />
                        </div>
                        <pre className="overflow-auto rounded-md bg-[oklch(0.18_0_0)] p-2 font-mono text-[10.5px] leading-relaxed text-emerald-200">
{prettifyJson(t.sampleResult ?? "{}")}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {resources.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Resources</div>
              <div className="space-y-1">
                {resources.map((r) => (
                  <div key={r.uri} className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-2.5 py-1.5 text-[11.5px]">
                    <FileText className="h-3 w-3 shrink-0 text-primary" />
                    <code className="font-mono">{r.name}</code>
                    <span className="ml-auto truncate text-muted-foreground">{r.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "install" && (
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-1 rounded-lg border border-black/5 bg-muted/30 p-1">
            {([
              ["claude", "Claude Code"],
              ["cursor", "Cursor"],
              ["codex", "Codex / Cline"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setClient(id)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${client === id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {client === "claude" ? "Run in your terminal" : client === "cursor" ? "Add to ~/.cursor/mcp.json" : "Add to your MCP config"}
              </span>
              <CopyButton text={installSnippet} />
            </div>
            <pre className="overflow-auto rounded-xl bg-[oklch(0.18_0_0)] p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
{installSnippet}
            </pre>
          </div>
          <div className="rounded-lg border border-black/5 bg-muted/20 p-3 text-[11.5px]">
            <div className="mb-1 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3 w-3" /> Authentication
            </div>
            <p className="text-muted-foreground">
              Pass your Beevr access key as a Bearer token. Generate one in <strong className="text-foreground">Access keys</strong>, then export <code className="rounded bg-white px-1 py-0.5 font-mono">BEEVR_KEY</code> in your shell.
            </p>
          </div>
        </div>
      )}

      {tab === "docs" && (
        draft.docsMarkdown
          ? <DocsMarkdown md={draft.docsMarkdown} />
          : <div className="p-6 text-center text-xs text-muted-foreground">No documentation generated.</div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-black/5 bg-muted/20 px-4 py-3">
        <span className="text-[11px] text-muted-foreground">Mock MCP — installable from any MCP-aware client.</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Discarded draft")}
            className="clicky-sm rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-black/5"
          >
            Dismiss
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="clicky inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? "Installing…" : "Install MCP"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClarifyCard({ draft, onSend }: { draft: ClarifyDraft; onSend: (text: string) => void }) {
  const questions = Array.isArray(draft?.questions) ? draft.questions : [];
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="shimmer-text">Drafting questions…</span>
      </div>
    );
  }

  const intentLabel = draft.intent === "agent" ? "agent" : draft.intent === "api" ? "API" : "MCP";

  const toggle = (qid: string, value: string, multi: boolean) => {
    setAnswers((cur) => {
      const prev = cur[qid] ?? [];
      if (multi) {
        return { ...cur, [qid]: prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value] };
      }
      return { ...cur, [qid]: [value] };
    });
  };

  const allAnswered = questions.every((q) => {
    const a = answers[q.id] ?? [];
    if (a.includes("__other__")) return (other[q.id] ?? "").trim().length > 0;
    return a.length > 0;
  });

  const submit = () => {
    const lines: string[] = [`Here are my answers (${intentLabel}):`];
    for (const q of questions) {
      const picks = answers[q.id] ?? [];
      const labels = picks.map((v) => {
        if (v === "__other__") return `Other: ${other[q.id] ?? ""}`.trim();
        return q.options.find((o) => o.value === v)?.label ?? v;
      });
      lines.push(`- ${q.question} → ${labels.join(", ")}`);
    }
    lines.push("", "Now go ahead and create it.");
    setSubmitted(true);
    onSend(lines.join("\n"));
  };

  return (
    <div className="animate-pop relative overflow-hidden rounded-2xl border border-primary/20 bg-white">
      <div className="relative px-5 pt-5 pb-3">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Quick questions · {intentLabel}
            </div>
            <p className="mt-0.5 text-sm text-foreground">{draft.summary}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-black/5 bg-muted/20 p-4">
        {questions.map((q, qi) => {
          const multi = !!q.multi;
          const allowOther = q.allowOther !== false;
          const picks = answers[q.id] ?? [];
          return (
            <div key={q.id} className="space-y-2">
              <div className="text-[13px] font-semibold text-foreground">
                <span className="mr-1.5 text-muted-foreground">{qi + 1}.</span>
                {q.question}
                {multi && <span className="ml-2 text-[10px] font-medium text-muted-foreground">(pick any)</span>}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o) => {
                  const active = picks.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      disabled={submitted}
                      onClick={() => toggle(q.id, o.value, multi)}
                      className={`clicky-sm group flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-all ${
                        active
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-black/10 bg-white text-foreground/85 hover:border-primary/40 hover:bg-primary/5"
                      } disabled:opacity-60`}
                    >
                      <span
                        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          active ? "border-primary bg-primary text-white" : "border-black/20 bg-white"
                        }`}
                      >
                        {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <div className="font-medium">{o.label}</div>
                        {o.description && <div className="text-[11px] text-muted-foreground">{o.description}</div>}
                      </span>
                    </button>
                  );
                })}
                {allowOther && (
                  <button
                    disabled={submitted}
                    onClick={() => toggle(q.id, "__other__", multi)}
                    className={`clicky-sm flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-all ${
                      picks.includes("__other__")
                        ? "border-primary bg-primary/5"
                        : "border-dashed border-black/15 bg-white hover:border-primary/40"
                    } disabled:opacity-60`}
                  >
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        picks.includes("__other__") ? "border-primary bg-primary text-white" : "border-black/20"
                      }`}
                    >
                      {picks.includes("__other__") && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    <span className="font-medium text-foreground/80">Other…</span>
                  </button>
                )}
              </div>
              {picks.includes("__other__") && (
                <input
                  autoFocus
                  disabled={submitted}
                  value={other[q.id] ?? ""}
                  onChange={(e) => setOther((c) => ({ ...c, [q.id]: e.target.value }))}
                  placeholder="Type your answer…"
                  className="w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-muted/30 px-4 py-3">
        {submitted ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Sent — building now
          </span>
        ) : (
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="clicky inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" /> Submit answers
          </button>
        )}
      </div>
    </div>
  );
}
