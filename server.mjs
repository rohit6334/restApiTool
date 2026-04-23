import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number.parseInt(process.env.PORT ?? "5055", 10);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function isMethodWithBody(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return {};
  }

  const output = {};

  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      output[key] = value;
    }
  });

  return output;
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function handleProxy(req, res) {
  const startedAt = Date.now();
  const rawBody = await readRequestBody(req);
  let payload;

  try {
    payload = JSON.parse(rawBody || "{}");
  } catch (_error) {
    sendJson(res, 400, { error: "Invalid JSON in request body." });
    return;
  }

  const targetUrl = typeof payload.url === "string" ? payload.url.trim() : "";
  const method = (typeof payload.method === "string" ? payload.method : "GET").toUpperCase();
  const headers = normalizeHeaders(payload.headers);
  const body = typeof payload.body === "string" ? payload.body : "";

  if (!targetUrl) {
    sendJson(res, 400, { error: "Missing target URL." });
    return;
  }

  let validatedUrl;
  try {
    validatedUrl = new URL(targetUrl);
  } catch (_error) {
    sendJson(res, 400, { error: "Invalid target URL." });
    return;
  }

  if (!["http:", "https:"].includes(validatedUrl.protocol)) {
    sendJson(res, 400, { error: "Only http/https URLs are supported." });
    return;
  }

  try {
    const upstreamResponse = await fetch(validatedUrl, {
      method,
      headers,
      body: isMethodWithBody(method) ? body : undefined,
    });

    const text = await upstreamResponse.text();
    const endedAt = Date.now();

    sendJson(res, 200, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      durationMs: endedAt - startedAt,
      headers: Object.fromEntries(upstreamResponse.headers.entries()),
      body: text,
    });
  } catch (error) {
    sendJson(res, 502, {
      error: "Proxy request failed.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function serveFile(req, res, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const normalizedPath = path.normalize(requestedPath);

  if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
    sendJson(res, 403, { error: "Forbidden path." });
    return;
  }

  const filePath = path.join(publicDir, normalizedPath);

  try {
    const fileContent = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
    res.end(fileContent);
  } catch (_error) {
    sendJson(res, 404, { error: "File not found." });
  }
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && reqUrl.pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "POST" && reqUrl.pathname === "/proxy") {
    await handleProxy(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveFile(req, res, reqUrl.pathname);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`REST API tester available at http://localhost:${port}`);
});
