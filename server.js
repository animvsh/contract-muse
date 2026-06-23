// Node.js entry point for the TanStack Start app.
//
// TanStack Start 1.167 emits a Web Standard `fetch` handler at
// `dist/server/server.js` but doesn't include an HTTP listener by default.
// It also doesn't serve static assets from `dist/client/` on its own.
//
// This wrapper:
//   1. Serves `dist/client/` (CSS, JS, images, favicon) as static files.
//   2. Delegates everything else to the TanStack Start `fetch` handler.
//
// Listens on PORT (defaults to 8080, which Railway uses).

import http from "node:http";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./dist/server/server.js";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

// Resolve once. `dist/client/` is what TanStack Start emits at build time.
const HERE = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = resolve(HERE, "dist", "client");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

const serveStatic = async (req, res) => {
  try {
    // req.url is the path + query. Strip query.
    const urlPath = (req.url || "/").split("?")[0];
    // Reject anything fishy before touching the filesystem.
    if (urlPath.includes("..")) return false;

    const filePath = normalize(join(CLIENT_DIR, urlPath));
    // Make sure the resolved file is still under CLIENT_DIR.
    if (!filePath.startsWith(CLIENT_DIR + "/") && filePath !== CLIENT_DIR) {
      return false;
    }

    let target = filePath;
    let info;
    try {
      info = await stat(target);
    } catch {
      // File doesn't exist — fall through to the SSR handler (404 page).
      return false;
    }

    if (info.isDirectory()) {
      // /something/ → /something/index.html if present, else 404.
      target = join(target, "index.html");
      try {
        info = await stat(target);
      } catch {
        return false;
      }
    }

    const data = await readFile(target);
    const mime = MIME[extname(target).toLowerCase()] || "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("content-type", mime);
    res.setHeader("content-length", String(data.length));
    // Hash-named assets get long-lived cache; everything else is short.
    if (urlPath.startsWith("/assets/")) {
      res.setHeader("cache-control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("cache-control", "public, max-age=0, must-revalidate");
    }
    res.end(data);
    return true;
  } catch (err) {
    console.error("[node-server] static serve error:", err);
    return false;
  }
};

const server = createServer(async (req, res) => {
  try {
    // 1) Static files first.
    if (await serveStatic(req, res)) return;

    // 2) Reconstruct a WHATWG URL from the incoming request.
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host =
      req.headers["x-forwarded-host"] || req.headers.host || `${HOST}:${PORT}`;
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    // 3) Build a Web Standard Request from the Node IncomingMessage.
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, String(value));
      }
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

    const webRequest = new Request(url.toString(), {
      method: req.method || "GET",
      headers,
      body:
        body && req.method && !["GET", "HEAD"].includes(req.method)
          ? body
          : undefined,
      duplex: "half",
    });

    const webResponse = await handler.fetch(webRequest);

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return;
      res.setHeader(key, value);
    });

    const setCookies =
      typeof webResponse.headers.getSetCookie === "function"
        ? webResponse.headers.getSetCookie()
        : null;
    if (setCookies && setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies);
    }

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const pump = async () => {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          if (value) res.write(Buffer.from(value));
        }
      };
      pump().catch((err) => {
        console.error("[node-server] stream error:", err);
        res.end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    console.error("[node-server] handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
    }
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[node-server] Listening on http://${HOST}:${PORT}`);
  console.log(`[node-server] Static dir: ${CLIENT_DIR}`);
});

// Graceful shutdown for Railway's deploy cycles.
const shutdown = (signal) => {
  console.log(`[node-server] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default server;