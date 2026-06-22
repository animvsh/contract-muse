import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Search,
  X,
  Download,
  Share2,
  Star,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  Presentation,
  FileType,
  Folder,
  Clock,
  Building2,
  Maximize2,
  Plus,
  Minus,
  LayoutGrid,
  Network,
  Star as StarIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/files")({
  component: Files,
});

type FileKind = "doc" | "sheet" | "slide" | "pdf" | "image" | "video" | "audio" | "code" | "folder";

type FileItem = {
  id: string;
  name: string;
  kind: FileKind;
  source: "Notion" | "Drive" | "Figma" | "Dropbox" | "Local" | "GitHub";
  owner: string;
  updated: string;
  size: string;
  starred?: boolean;
  preview: string; // body for the viewer
};

const FILES: FileItem[] = [
  {
    id: "f_001",
    name: "Beevr — Employment & Hiring Policy.doc",
    kind: "doc",
    source: "Notion",
    owner: "Adithya Rao",
    updated: "2d ago",
    size: "48 KB",
    starred: true,
    preview:
      "## Beevr Employment & Hiring Policy\n\nThis document outlines the standard hiring workflow at Beevr.\n\n1. Inbound applications are screened within 48 hours.\n2. Initial screen is 30 minutes with the hiring manager.\n3. Take-home is paid at $200 and capped at 4 hours.\n4. Final loop covers craft, collaboration, and values.\n\nAll offers must be approved by the founders before being sent.",
  },
  {
    id: "f_002",
    name: "Q3 Marketing Plan.doc",
    kind: "doc",
    source: "Notion",
    owner: "Maya Chen",
    updated: "5h ago",
    size: "112 KB",
    preview:
      "## Q3 Marketing Plan\n\n**Goal:** Drive 2,500 qualified workspace signups by end of Q3.\n\n- Launch the agent showcase landing page in week 2\n- Run a paid pilot on LinkedIn targeting heads of ops at 50–500p companies\n- Publish 6 long-form case studies\n- Founder podcast tour — book 8 shows",
  },
  {
    id: "f_003",
    name: "Pricing Strategy 2026.sheet",
    kind: "sheet",
    source: "Drive",
    owner: "Jordan Park",
    updated: "6h ago",
    size: "204 KB",
    preview:
      "Tier        | Monthly | Seats | Agents\nStarter     | $49     | 3     | 5\nTeam        | $199    | 10    | 25\nBusiness    | $599    | 50    | unlimited\nEnterprise  | custom  | custom| custom\n\nNotes: Team is the volume sweet spot. Compress Starter cap to push upgrades.",
  },
  {
    id: "f_004",
    name: "Brand Guidelines.fig",
    kind: "image",
    source: "Figma",
    owner: "Lena Park",
    updated: "2w ago",
    size: "8.4 MB",
    preview:
      "Primary palette: oklch(0.68 0.22 40) (Beevr Orange), oklch(0.04 0 0) (Black).\n\nTypography: Inter for UI, Söhne for marketing.\n\nLogo clearspace: 1x the height of the bee mark on every side.",
  },
  {
    id: "f_005",
    name: "Customer Interview — Acme Corp.doc",
    kind: "doc",
    source: "Drive",
    owner: "Priya Shah",
    updated: "3d ago",
    size: "36 KB",
    preview:
      "## Acme Corp — 30 min interview\n\n**Pain:** Their ops team is drowning in Slack triage.\n**Wishlist:** Auto-summarize threads, route to the right channel, file follow-ups.\n**Budget:** ~$2k/mo if it removes one FTE of toil.\n**Next step:** Send a pilot proposal by Friday.",
  },
  {
    id: "f_006",
    name: "Investor Update — Nov.pdf",
    kind: "pdf",
    source: "Drive",
    owner: "Adithya Rao",
    updated: "1d ago",
    size: "1.2 MB",
    starred: true,
    preview:
      "Beevr — November Investor Update\n\nMRR: $128k (+18% MoM)\nWorkspaces: 412\nNet retention: 138%\nRunway: 22 months\n\nBig wins: Acme pilot signed, hired Maya as Head of Marketing, launched Workspaces v2.",
  },
  {
    id: "f_007",
    name: "Onboarding Walkthrough.mp4",
    kind: "video",
    source: "Dropbox",
    owner: "Sam Whitfield",
    updated: "4d ago",
    size: "84 MB",
    preview:
      "Recorded walkthrough of the Beevr onboarding flow. 6:42 in length. Covers workspace creation, first agent, connecting Slack, and inviting teammates.",
  },
  {
    id: "f_008",
    name: "Launch Deck.slide",
    kind: "slide",
    source: "Drive",
    owner: "Maya Chen",
    updated: "12h ago",
    size: "5.6 MB",
    preview:
      "Slide 1 — The problem: every company runs on tribal knowledge.\nSlide 2 — Beevr: an AI brain that knows your company.\nSlide 3 — Demo.\nSlide 4 — Traction.\nSlide 5 — The team.\nSlide 6 — The ask: $4M seed.",
  },
  {
    id: "f_009",
    name: "Office Photo — All Hands.jpg",
    kind: "image",
    source: "Local",
    owner: "Lena Park",
    updated: "1w ago",
    size: "2.1 MB",
    preview: "Photo of the Beevr team at the November all-hands offsite. 14 people, sunny.",
  },
  {
    id: "f_010",
    name: "agents.config.ts",
    kind: "code",
    source: "GitHub",
    owner: "Jordan Park",
    updated: "3h ago",
    size: "12 KB",
    preview:
      "export const AGENTS = [\n  { id: 'sales-digest', name: 'Sales Digest', schedule: 'weekly' },\n  { id: 'inbox-triage', name: 'Inbox Triage', schedule: 'realtime' },\n  { id: 'investor-update', name: 'Investor Update', schedule: 'monthly' },\n];",
  },
  {
    id: "f_011",
    name: "Sales Call — Globex.mp3",
    kind: "audio",
    source: "Dropbox",
    owner: "Jordan Park",
    updated: "2d ago",
    size: "18 MB",
    preview:
      "Audio recording of the Globex discovery call. 32:14 in length. Auto-transcribed; transcript indexed in the brain.",
  },
  {
    id: "f_012",
    name: "Customer Contracts",
    kind: "folder",
    source: "Drive",
    owner: "Adithya Rao",
    updated: "5h ago",
    size: "24 files",
    preview: "Folder containing all signed customer contracts, organized by quarter.",
  },
];

const KIND_META: Record<
  FileKind,
  { icon: typeof FileText; tone: string; label: string }
> = {
  doc: { icon: FileText, tone: "oklch(0.55 0.2 250)", label: "Document" },
  sheet: { icon: FileSpreadsheet, tone: "oklch(0.6 0.18 145)", label: "Spreadsheet" },
  slide: { icon: Presentation, tone: "oklch(0.65 0.2 35)", label: "Slides" },
  pdf: { icon: FileType, tone: "oklch(0.6 0.22 25)", label: "PDF" },
  image: { icon: FileImage, tone: "oklch(0.65 0.2 320)", label: "Image" },
  video: { icon: FileVideo, tone: "oklch(0.55 0.22 280)", label: "Video" },
  audio: { icon: FileAudio, tone: "oklch(0.6 0.18 200)", label: "Audio" },
  code: { icon: FileCode, tone: "oklch(0.45 0.05 250)", label: "Code" },
  folder: { icon: Folder, tone: "oklch(0.65 0.16 75)", label: "Folder" },
};

const FILTERS = ["All", "Starred", "Documents", "Spreadsheets", "Slides", "PDFs", "Images", "Media", "Code", "Folders"] as const;

function matches(f: FileItem, q: string, filter: (typeof FILTERS)[number]) {
  if (q && !f.name.toLowerCase().includes(q.toLowerCase()) && !f.owner.toLowerCase().includes(q.toLowerCase())) return false;
  if (filter === "All") return true;
  if (filter === "Starred") return !!f.starred;
  if (filter === "Documents") return f.kind === "doc";
  if (filter === "Spreadsheets") return f.kind === "sheet";
  if (filter === "Slides") return f.kind === "slide";
  if (filter === "PDFs") return f.kind === "pdf";
  if (filter === "Images") return f.kind === "image";
  if (filter === "Media") return f.kind === "video" || f.kind === "audio";
  if (filter === "Code") return f.kind === "code";
  if (filter === "Folders") return f.kind === "folder";
  return true;
}

type GraphNode = {
  id: string;
  kind: "center" | "source" | "file";
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  source?: string;
  file?: FileItem;
};

type GraphEdge = { from: string; to: string };

const SOURCE_TONE: Record<string, string> = {
  Notion: "oklch(0.45 0.05 250)",
  Drive: "oklch(0.6 0.18 145)",
  Figma: "oklch(0.65 0.2 320)",
  Dropbox: "oklch(0.55 0.2 250)",
  Local: "oklch(0.55 0.05 60)",
  GitHub: "oklch(0.3 0.02 250)",
};

const WORLD_W = 2800;
const WORLD_H = 2000;

function buildGraph(files: FileItem[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  const nodes: GraphNode[] = [
    { id: "center", kind: "center", x: cx, y: cy, label: "Workspace", sublabel: "Beevr" },
  ];
  const edges: GraphEdge[] = [];
  const sources = Array.from(new Set(files.map((f) => f.source)));
  const sourceRadius = 340;
  sources.forEach((src, i) => {
    const a = (i / sources.length) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(a) * sourceRadius;
    const sy = cy + Math.sin(a) * sourceRadius;
    const sId = `src_${src}`;
    nodes.push({ id: sId, kind: "source", x: sx, y: sy, label: src, source: src });
    edges.push({ from: "center", to: sId });
    const inSource = files.filter((f) => f.source === src);
    const fileRadius = 230;
    const spread = Math.min(Math.PI * 0.7, ((Math.PI * 2) / Math.max(sources.length, 1)) * 0.85);
    inSource.forEach((f, j) => {
      const t = inSource.length === 1 ? 0 : j / (inSource.length - 1) - 0.5;
      const fa = a + t * spread;
      nodes.push({
        id: f.id,
        kind: "file",
        x: sx + Math.cos(fa) * fileRadius,
        y: sy + Math.sin(fa) * fileRadius,
        label: f.name,
        source: src,
        file: f,
      });
      edges.push({ from: sId, to: f.id });
    });
  });
  return { nodes, edges };
}

function computeBounds(nodes: GraphNode[]) {
  // Pad for node visual extents (file cards are ~180 wide, source ~80)
  const pad = 140;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function Files() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "grid">("graph");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.55);
  const [animating, setAnimating] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const dragging = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const matchedIds = useMemo(() => {
    if (!query) return new Set(FILES.map((f) => f.id));
    const q = query.toLowerCase();
    return new Set(
      FILES.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.owner.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q),
      ).map((f) => f.id),
    );
  }, [query]);
  const { nodes, edges } = useMemo(() => buildGraph(FILES), []);
  const bounds = useMemo(() => computeBounds(nodes), [nodes]);
  const open = openId ? FILES.find((f) => f.id === openId) ?? null : null;

  const fit = (animate = true) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Reserve top safe area for the floating header overlay
    const topSafe = 132;
    const bottomSafe = 16;
    const sideSafe = 24;
    const availW = Math.max(200, r.width - sideSafe * 2);
    const availH = Math.max(200, r.height - topSafe - bottomSafe);
    const w = bounds.maxX - bounds.minX;
    const h = bounds.maxY - bounds.minY;
    const z = Math.min(availW / w, availH / h, 1.2);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    if (animate) setAnimating(true);
    setZoom(z);
    setPan({
      x: sideSafe + availW / 2 - cx * z,
      y: topSafe + availH / 2 - cy * z,
    });
    if (animate) window.setTimeout(() => setAnimating(false), 750);
  };

  const centerOnNode = (nodeId: string, targetZoom = 1.0) => {
    const n = nodes.find((nn) => nn.id === nodeId);
    const el = containerRef.current;
    if (!n || !el) return;
    const r = el.getBoundingClientRect();
    const topSafe = 132;
    setAnimating(true);
    setZoom(targetZoom);
    setPan({
      x: r.width / 2 - n.x * targetZoom,
      y: topSafe + (r.height - topSafe) / 2 - n.y * targetZoom,
    });
    setPulseId(nodeId);
    window.setTimeout(() => setAnimating(false), 750);
    window.setTimeout(() => setPulseId((p) => (p === nodeId ? null : p)), 1800);
  };

  // Fit on mount and whenever the view becomes graph
  useEffect(() => {
    if (view !== "graph") return;
    // Defer to next frame so container has measured size
    const id = requestAnimationFrame(() => fit(false));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Refit on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el || view !== "graph") return;
    const ro = new ResizeObserver(() => fit(false));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, bounds]);

  // Animate zoom onto first match when searching in graph view
  useEffect(() => {
    if (view !== "graph" || !query) return;
    const first = FILES.find((f) => matchedIds.has(f.id));
    if (!first) return;
    const t = window.setTimeout(() => centerOnNode(first.id, 1.0), 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, view]);

  // Native non-passive wheel listener so we can preventDefault and stop the
  // page from scrolling while zooming inside the graph.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || view !== "graph") return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => {
        const next = Math.min(1.6, Math.max(0.2, z + delta));
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        setPan((p) => {
          const wx = (mx - p.x) / z;
          const wy = (my - p.y) / z;
          return { x: mx - wx * next, y: my - wy * next };
        });
        return next;
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [view]);
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setAnimating(false);
    dragging.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragging.current.px + (e.clientX - dragging.current.x),
      y: dragging.current.py + (e.clientY - dragging.current.y),
    });
  };
  const endDrag = () => {
    dragging.current = null;
  };

  const filteredFiles = useMemo(
    () => FILES.filter((f) => matchedIds.has(f.id)),
    [matchedIds],
  );

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col items-stretch gap-3 p-4 sm:p-6 md:flex-row md:items-start md:justify-between">
        <div className="pointer-events-auto min-w-0 max-w-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[oklch(0.68_0.22_40)]">
            <Folder className="h-3.5 w-3.5" /> {view === "graph" ? "Knowledge graph" : "All files"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Files</h1>
          <p className="mt-1 hidden text-sm text-[oklch(0.4_0_0)] xl:block">
            {view === "graph"
              ? "Every source and file connected to your workspace. Drag to pan, scroll to zoom."
              : "Browse your workspace files in a clean list."}
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur focus-within:border-[oklch(0.68_0.22_40)]/40 md:flex-initial">
            <Search className="h-4 w-4 shrink-0 text-[oklch(0.5_0_0)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={view === "graph" ? "Search the graph…" : "Search files…"}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[oklch(0.55_0_0)] md:w-40 lg:w-56"
            />
          </div>
          <div className="flex shrink-0 rounded-xl border border-black/10 bg-white/90 p-1 shadow-sm backdrop-blur">
            <button
              onClick={() => setView("graph")}
              className={`clicky-sm flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${view === "graph" ? "bg-[oklch(0.15_0_0)] text-white" : "text-[oklch(0.4_0_0)] hover:bg-black/5"}`}
              title="Graph view"
            >
              <Network className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Graph</span>
            </button>
            <button
              onClick={() => setView("grid")}
              className={`clicky-sm flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${view === "grid" ? "bg-[oklch(0.15_0_0)] text-white" : "text-[oklch(0.4_0_0)] hover:bg-black/5"}`}
              title="List view"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Files</span>
            </button>
          </div>
        </div>
      </div>

      {view === "grid" && (
        <div className="flex-1 overflow-y-auto bg-[oklch(0.985_0.005_85)] px-4 pb-6 pt-32 sm:px-8 sm:pt-36">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-black/10 bg-white/60 p-10 text-center text-sm text-[oklch(0.5_0_0)]">
                No files match "{query}".
              </div>
            )}
            {filteredFiles.map((f) => {
              const meta = KIND_META[f.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setOpenId(f.id)}
                  className="clicky group flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[oklch(0.68_0.22_40)]/40 hover:shadow-lg animate-[fadeInUp_140ms_ease-out]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ background: meta.tone }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-sm font-semibold text-[oklch(0.18_0_0)]">{f.name}</div>
                      {f.starred && <StarIcon className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[oklch(0.5_0_0)]">
                      {f.source} · {f.owner}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[oklch(0.55_0_0)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {f.updated}
                      </span>
                      <span>·</span>
                      <span>{f.size}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "graph" && (

      <div
        ref={containerRef}
        
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="relative flex-1 cursor-grab overflow-hidden bg-[oklch(0.985_0.005_85)] active:cursor-grabbing"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.85 0.01 85) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: 2800,
            height: 2000,
            transition: animating ? "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        >
          <svg width={2800} height={2000} className="pointer-events-none absolute inset-0">
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.68 0.22 40)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="oklch(0.68 0.22 40)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={1400} cy={1000} r={520} fill="url(#centerGlow)" />
            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.from)!;
              const b = nodes.find((n) => n.id === e.to)!;
              const isMatch = b.kind !== "file" || matchedIds.has(b.id);
              const active = hoverId === a.id || hoverId === b.id;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active ? "oklch(0.68 0.22 40)" : "oklch(0.7 0.02 85)"}
                  strokeWidth={active ? 2.5 : 1.25}
                  strokeOpacity={isMatch ? (active ? 0.9 : 0.45) : 0.08}
                  strokeDasharray={a.kind === "center" ? "0" : "4 6"}
                />
              );
            })}
          </svg>

          {nodes.map((n) => {
            if (n.kind === "center") {
              return (
                <div
                  key={n.id}
                  data-node
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: n.x, top: n.y }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.72_0.22_40)] to-[oklch(0.6_0.22_30)] text-white shadow-[0_20px_60px_-15px_oklch(0.68_0.22_40_/_0.6)] ring-4 ring-white">
                    <Building2 className="h-7 w-7" />
                    <div className="mt-1 text-xs font-semibold tracking-wide">{n.label}</div>
                    <div className="text-[10px] opacity-80">{n.sublabel}</div>
                  </div>
                </div>
              );
            }
            if (n.kind === "source") {
              const tone = SOURCE_TONE[n.source!] ?? "oklch(0.5 0 0)";
              return (
                <div
                  key={n.id}
                  data-node
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: n.x, top: n.y }}
                >
                  <div
                    className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.25)] ring-[3px] ring-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.3)] active:scale-[0.97]"
                    style={{ background: tone }}
                  >
                    <Folder className="h-5 w-5" />
                    <div className="mt-1 text-[10px] font-semibold tracking-wide">{n.label}</div>
                  </div>
                </div>
              );
            }
            const f = n.file!;
            const meta = KIND_META[f.kind];
            const Icon = meta.icon;
            const dim = !matchedIds.has(f.id);
            return (
              <button
                key={n.id}
                data-node
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => setOpenId(f.id)}
                className={`clicky absolute flex w-44 -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-xl border border-black/[0.06] bg-white/95 p-3 text-left shadow-[0_8px_20px_-8px_rgba(0,0,0,0.18)] backdrop-blur transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[oklch(0.68_0.22_40)]/40 hover:shadow-[0_18px_36px_-12px_rgba(0,0,0,0.25)] active:translate-y-0 ${dim ? "opacity-25" : ""} ${pulseId === n.id ? "scale-110 ring-4 ring-[oklch(0.68_0.22_40)]/50 shadow-[0_0_40px_oklch(0.68_0.22_40_/_0.5)]" : ""}`}
                style={{ left: n.x, top: n.y }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ background: meta.tone }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {f.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-[oklch(0.2_0_0)]">{f.name}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-[oklch(0.5_0_0)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {f.updated}
                    </span>
                    <span>{f.size}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl border border-black/10 bg-white/90 p-1 shadow-md backdrop-blur">
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
            className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.3_0_0)] hover:bg-black/5"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
            className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.3_0_0)] hover:bg-black/5"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => fit(true)}
            className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.3_0_0)] hover:bg-black/5"
            title="Recenter"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg bg-white/80 px-2.5 py-1 text-[10px] font-medium text-[oklch(0.45_0_0)] shadow-sm backdrop-blur">
          {Math.round(zoom * 100)}%
        </div>
      </div>
      )}

      {open && <FileViewer file={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function FileViewer({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const meta = KIND_META[file.kind];
  const Icon = meta.icon;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-[fadeInUp_140ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: meta.tone }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-[oklch(0.15_0_0)]">{file.name}</div>
            <div className="mt-0.5 text-[11px] text-[oklch(0.5_0_0)]">
              {meta.label} · {file.source} · {file.owner} · updated {file.updated} · {file.size}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.4_0_0)] hover:bg-black/5" title="Share">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.4_0_0)] hover:bg-black/5" title="Download">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="clicky clicky-sm rounded-lg p-2 text-[oklch(0.4_0_0)] hover:bg-black/5" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[oklch(0.98_0.01_85)] p-6">
          <FilePreview file={file} />
        </div>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: FileItem }) {
  const meta = KIND_META[file.kind];
  if (file.kind === "image") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-72 w-full items-center justify-center rounded-xl text-white shadow-inner"
          style={{
            background: meta.tone,
          }}
        >
          <FileImage className="h-16 w-16 opacity-90" />
        </div>
        <p className="max-w-md text-center text-sm leading-relaxed text-[oklch(0.4_0_0)]">{file.preview}</p>
      </div>
    );
  }
  if (file.kind === "video" || file.kind === "audio") {
    const Icon = file.kind === "video" ? FileVideo : FileAudio;
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-56 w-full items-center justify-center rounded-xl text-white shadow-inner"
          style={{ background: meta.tone }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Icon className="h-7 w-7" />
          </div>
        </div>
        <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/10">
          <div className="h-full w-1/3 rounded-full" style={{ background: meta.tone }} />
        </div>
        <p className="max-w-md text-center text-sm leading-relaxed text-[oklch(0.4_0_0)]">{file.preview}</p>
      </div>
    );
  }
  if (file.kind === "code") {
    return (
      <pre className="overflow-x-auto rounded-xl bg-[oklch(0.18_0.02_250)] p-5 text-[12px] leading-relaxed text-[oklch(0.85_0.02_85)]">
        <code>{file.preview}</code>
      </pre>
    );
  }
  if (file.kind === "sheet") {
    const lines = file.preview.split("\n");
    const rows = lines.filter((l) => l.includes("|")).map((l) => l.split("|").map((c) => c.trim()));
    const notes = lines.filter((l) => !l.includes("|") && l.trim()).join("\n");
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i === 0 ? "bg-[oklch(0.97_0.02_85)] font-semibold" : "border-t border-black/5"}>
                  {r.map((c, j) => (
                    <td key={j} className="px-4 py-2 tabular-nums text-[oklch(0.25_0_0)]">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {notes && <p className="text-sm text-[oklch(0.4_0_0)]">{notes}</p>}
      </div>
    );
  }
  if (file.kind === "folder") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ background: meta.tone }}
        >
          <Folder className="h-10 w-10" />
        </div>
        <p className="max-w-md text-sm text-[oklch(0.4_0_0)]">{file.preview}</p>
      </div>
    );
  }
  // doc, pdf, slide → render preview text as a simple document
  return (
    <article className="prose prose-sm mx-auto max-w-none rounded-xl border border-black/5 bg-white p-6 text-[oklch(0.2_0_0)] shadow-sm">
      {file.preview.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="mt-4 text-lg font-semibold first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("- ")) return <div key={i} className="ml-4 mt-1 text-sm">• {line.slice(2)}</div>;
        if (/^\d+\./.test(line)) return <div key={i} className="ml-4 mt-1 text-sm">{line}</div>;
        if (!line.trim()) return <div key={i} className="h-2" />;
        return <p key={i} className="mt-2 text-sm leading-relaxed">{line}</p>;
      })}
    </article>
  );
}
