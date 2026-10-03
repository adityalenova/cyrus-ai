/* ══ github-exchange.worker.mjs — token-exchange relay for "Sign in with
   GitHub" on the static cyrus.ai site.

   Why: github.com/login/oauth/access_token sends no CORS headers, so a
   browser cannot do the code -> token exchange itself. This tiny Worker
   performs the exchange and holds the OAuth app's client secret server-side
   (the secret NEVER lives in the site bundle or this repo).

   Deploy (Cloudflare Workers, from any folder):
     npx wrangler deploy --name cyrus-gh-exchange \
       --compatibility-date 2026-01-01 --main scripts/github-exchange.worker.mjs \
       --var ALLOWED_ORIGIN:https://your-site.example
     npx wrangler secret put GITHUB_CLIENT_SECRET
   Or paste this file into the Workers playground and set the vars there.

   Then in the site's .env:
     VITE_GITHUB_EXCHANGE_URL=https://cyrus-gh-exchange.<acct>.workers.dev/exchange
                                                              ═ */

const cors = (res, origin) => {
  res.headers.set("access-control-allow-origin", origin);
  res.headers.set("access-control-allow-methods", "POST, OPTIONS");
  res.headers.set("access-control-allow-headers", "content-type");
  res.headers.set("access-control-max-age", "600");
  return res;
};

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN?.trim() || req.headers.get("origin") || "*";
    if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }), origin);
    if (req.method !== "POST" || !new URL(req.url).pathname.startsWith("/exchange"))
      return cors(Response.json({ error: "not_found" }, { status: 404 }), origin);
    if (!env.GITHUB_CLIENT_SECRET)
      return cors(Response.json({ error: "relay not configured - set the GITHUB_CLIENT_SECRET secret" }, { status: 500 }), origin);

    let body;
    try { body = await req.json(); } catch { return cors(Response.json({ error: "bad_json" }, { status: 400 }), origin); }
    const { client_id, code, code_verifier } = body ?? {};
    if (!client_id || !code) return cors(Response.json({ error: "missing client_id or code" }, { status: 400 }), origin);

    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        client_id,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        ...(code_verifier ? { code_verifier } : {}),
        grant_type: "authorization_code",
      }),
    });
    const text = await r.text();
    return cors(new Response(text, { status: r.status, headers: { "content-type": "application/json" } }), origin);
  },
};
