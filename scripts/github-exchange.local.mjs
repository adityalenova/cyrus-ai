/* ══ github-exchange.local.mjs — local token-exchange relay for "Sign in with
   GitHub" on cyrus.ai (the no-deploy alternative to the Cloudflare Worker).

   Why: github.com/login/oauth/access_token sends no CORS headers, so the
   browser cannot finish the code -> token exchange by itself. This tiny
   Node server does the exchange and keeps the client secret off GitHub's
   browser-side restrictions. It listens on http://localhost:8787 and the
   site talks to it via VITE_GITHUB_EXCHANGE_URL=http://localhost:8787/exchange.

   Setup (one time, in your terminal - never paste the secret into the repo
   or into chat):
     echo -n "<your GitHub OAuth app client secret>" > .github-secret
   .github-secret is gitignored; edit GITHUB_CLIENT_SECRET in-memory only.

   Run (in a second terminal while you develop):
     npm run gh-relay
                                                             ═ */
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECRET_FILE = join(ROOT, ".github-secret");
const CLIENT_ID = process.env.VITE_GITHUB_CLIENT_ID || "";

let secret = "";
if (existsSync(SECRET_FILE)) secret = readFileSync(SECRET_FILE, "utf8").trim();
if (secret.includes("PASTE-YOUR")) secret = ""; // still the placeholder text

const cors = (res) => {
  res.setHeader("access-control-allow-origin", "*"); // dev relay: localhost only
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
};

const json = (res, code, obj) => {
  cors(res);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(obj));
};

if (!secret) console.warn("! .github-secret not found - put the GitHub client secret in that file, then restart this relay.");
else console.log("* loaded GitHub client secret from .github-secret");

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }

  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, secretLoaded: !!secret });
  if (req.method !== "POST" || url.pathname !== "/exchange") return json(res, 404, { error: "not found" });

  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
  req.on("end", async () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return json(res, 400, { error: "invalid json" }); }
    const { code, code_verifier: verifier, client_id } = payload;
    if (!code) return json(res, 400, { error: "missing code" });
    if (!secret) return json(res, 400, { error_description: "no client secret loaded - save the real secret into .github-secret and restart npm run gh-relay" });
    try {
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          client_id: client_id || CLIENT_ID || undefined,
          client_secret: secret,
          code,
          ...(verifier ? { code_verifier: verifier } : {}),
          grant_type: "authorization_code",
        }),
      });
      const data = await r.json();
      return json(res, r.status, data);
    } catch (e) {
      return json(res, 502, { error: "github exchange failed", detail: String(e?.message ?? e) });
    }
  });
}).listen(8787, () => console.log("* cyrus github relay listening on http://localhost:8787/exchange"));
