import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, X, AlertCircle, FileText, Image as ImageIcon, FileVideo, FileAudio, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Status = "uploading" | "done" | "error";
type Item = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: Status;
  progress: number;
  url?: string;
  error?: string;
};

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("text") || mime.includes("json") || mime.includes("pdf")) return FileText;
  return File;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function GlobalUploader() {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(true);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!user || files.length === 0) return;
      const newItems: Item[] = files.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`,
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        status: "uploading",
        progress: 4,
      }));
      setItems((prev) => [...newItems, ...prev]);
      setOpen(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = newItems[i];

        // smooth fake progress while supabase upload runs
        const tick = setInterval(() => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id && it.status === "uploading"
                ? { ...it, progress: Math.min(92, it.progress + Math.max(2, (95 - it.progress) * 0.08)) }
                : it,
            ),
          );
        }, 120);

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from("user-uploads")
          .upload(path, file);
        clearInterval(tick);

        if (error) {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: "error", error: error.message, progress: 100 } : it)),
          );
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }

        const { data: signed } = await supabase.storage
          .from("user-uploads")
          .createSignedUrl(path, 60 * 60 * 24);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "done", progress: 100, url: signed?.signedUrl } : it,
          ),
        );
      }

      const okCount = files.length;
      toast.success(`${okCount} file${okCount === 1 ? "" : "s"} uploaded`);
    },
    [user],
  );

  // Global window drag listeners
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      dragCounter.current += 1;
      setDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) void handleFiles(files);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleFiles]);

  const activeCount = items.filter((i) => i.status === "uploading").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <>
      {/* Full-screen drop overlay */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[oklch(0.04_0_0)]/45 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]">
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-white/60 bg-white/10 px-12 py-10 text-white shadow-2xl">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[oklch(0.68_0.22_40)] shadow-lg">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">Drop to upload</div>
              <div className="mt-1 text-sm text-white/80">Files are saved to your workspace</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating upload widget */}
      {items.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[150] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl animate-[fadeInUp_160ms_ease-out]">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 border-b border-black/5 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[oklch(0.68_0.22_40)]/10 text-[oklch(0.68_0.22_40)]">
                {activeCount > 0 ? (
                  <UploadCloud className="h-4 w-4 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {activeCount > 0 ? `Uploading ${activeCount}…` : `${doneCount} uploaded`}
                </div>
                <div className="text-[11px] text-[oklch(0.5_0_0)]">
                  {items.length} file{items.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeCount === 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setItems([]);
                  }}
                  className="rounded-md p-1 text-[oklch(0.5_0_0)] hover:bg-black/5"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
          {open && (
            <div className="max-h-72 space-y-1 overflow-y-auto p-2">
              {items.map((it) => {
                const Icon = fileIcon(it.type);
                return (
                  <div key={it.id} className="rounded-xl px-2 py-2 hover:bg-black/[0.02]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                          it.status === "error"
                            ? "bg-red-50 text-red-600"
                            : it.status === "done"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-[oklch(0.97_0_0)] text-[oklch(0.4_0_0)]"
                        }`}
                      >
                        {it.status === "error" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : it.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-[oklch(0.2_0_0)]">{it.name}</div>
                        <div className="text-[10px] text-[oklch(0.5_0_0)]">
                          {fmtSize(it.size)}
                          {it.status === "error" && it.error ? ` · ${it.error}` : ""}
                        </div>
                      </div>
                      {it.status === "done" && it.url && (
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md px-2 py-1 text-[10px] font-semibold text-[oklch(0.68_0.22_40)] hover:bg-[oklch(0.68_0.22_40)]/10"
                        >
                          Open
                        </a>
                      )}
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.05]">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ease-out ${
                          it.status === "error"
                            ? "bg-red-500"
                            : it.status === "done"
                              ? "bg-emerald-500"
                              : "bg-[oklch(0.68_0.22_40)]"
                        }`}
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
