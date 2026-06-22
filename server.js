// Node.js entry point for the TanStack Start app.
//
// TanStack Start 1.167 emits a Web Standard `fetch` handler at
// `dist/server/server.js` but doesn't include an HTTP listener by default.
// This file wraps that handler with Node's built-in `http` server so the
// app can run on Railway / any Node host.
//
// Listens on PORT (defaults to 8080, which Railway uses).

import http from "node:http";
import { createServer } from "node:http";
import handler from "./dist/server/server.js";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

const server = createServer(async (req, res) => {
  try {
    // Reconstruct a WHATWG URL from the incoming request.
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host =
      req.headers["x-forwarded-host"] || req.headers.host || `${HOST}:${PORT}`;
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    // Build a Web Standard Request from the Node IncomingMessage.
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