<p align="center">
  <img src="docs/readme/logo.svg" alt="cyrus.ai" width="300"/>
</p>

<h1 align="center">cyrus.ai</h1>

<p align="center">
  <a href="https://cyrus-agent.vercel.app"><img src="https://img.shields.io/badge/live_site-cyrus--agent.vercel.app-d9a441?style=flat-square" alt="Live site"/></a>
  <a href="https://github.com/adityalenova/cyrus-ai"><img src="https://img.shields.io/badge/repos_indexed-1%2C528-c9683f?style=flat-square" alt="Repos indexed"/></a>
  <a href="https://github.com/adityalenova/cyrus-ai"><img src="https://img.shields.io/badge/stars_tracked-33.8M-7f9a4e?style=flat-square" alt="Stars tracked"/></a>
  <a href="https://github.com/adityalenova/cyrus-ai"><img src="https://img.shields.io/badge/hackathons_listed-161-4e8f6b?style=flat-square" alt="Hackathons listed"/></a>
  <img src="https://img.shields.io/badge/data_snapshot-03_Oct_2026-a1739b?style=flat-square" alt="Data snapshot"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-149eca?style=flat-square&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript_strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Vite_6-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/deployed-Vercel-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

A developer-program platform: it turns the scattered world of **AI-agent tooling, open-source programs and hackathons** into one browsable, self-refreshing catalog with real sign-in. Built as a fully static Vite + React 19 SPA - no backend to host, yet it tracks over half a million data points pulled straight from GitHub, Devpost and Google Summer of Code archives.

---

## By the numbers

| Section | What the site holds | Where the data comes from |
|---|---|---|
| Agent-skills catalog | **1,528 repos** · 33.79M stars · 4.61M forks | GitHub REST via `gh api`, re-fetched by `npm run refresh` |
| Open-source programs | **5,238 GSoC projects** (2021-2025) · 305 mentoring orgs · 3,075 tech tags | Google Summer of Code archive JSON |
| Program deep dives | **8 programs** with stats and charts (GSoC, GSSoC, LFX, Outreachy, Eclipse SoC, MLH, KDE, Hacktoberfest) | curated in `src/data/programDetails.ts` |
| Hackathon board | **161 events** - 18 curated + 143 live Devpost listings with deadlines and prize pools | `devpost.com/api/hackathons` |
| Organizations | **43 org pages** with live follower, repo and star intel | `scripts/fetch-orgs.mjs` |
| Learning resources | **58 first-party resources** from the companies shipping the tools | curated |

## The catalog at a glance

<p align="center">
  <img src="docs/readme/catalog-by-category.svg" alt="Catalog by category" width="720"/>
</p>

<p align="center">
  <img src="docs/readme/language-mix.svg" alt="Language mix of the catalog" width="680"/>
</p>

<p align="center">
  <img src="docs/readme/licenses.svg" alt="License mix of the catalog" width="720"/>
</p>

## The shape of the app

```mermaid
flowchart LR
    subgraph sources [Data sources]
        GH[GitHub API] -->|npm run refresh| D1[src/data/repos.ts]
        GH -->|npm run orgs| D2[src/data/realOrgs.ts]
        DP[Devpost API] -->|npm run refresh| D3[src/data/hackathonsLive.ts]
        SOC[GSoC archive] --> D4[public/data/gsoc-projects.json]
    end
    subgraph app [Static SPA - Vite + React 19]
        D1 & D2 & D3 & D4 --> PAGES[15 routes: Home, /organizations, /opensource,<br/>/hackathons, /projects, /resources, /dashboard, /nova ...]
    end
    PAGES --> V[(Vercel CDN<br/>cyrus-agent.vercel.app)]
```

Everything renders client-side from typed, checked-in snapshots - the site boots instantly, works offline after first load, and the refresh scripts rewrite the datasets in place whenever you re-run them.

## Sign-in, actually real

No demo auth. Both providers run real OAuth against this static bundle:

- **Google** - raw OIDC implicit flow (full-page redirect, no GIS dependency); the `id_token` comes back in the URL fragment, nonce verified against `sessionStorage`.
- **GitHub** - OAuth **PKCE (S256)** in a popup; the code lands on same-origin `github-callback.html` and is post-Messaged back. Browsers can't call GitHub's token endpoint (no CORS), so a tiny relay holds the client secret: `npm run gh-relay` locally, a Cloudflare Worker in production.

```mermaid
sequenceDiagram
    participant U as User
    participant S as cyrus.ai SPA
    participant G as github.com
    participant R as Exchange relay
    U->>S: Click "Sign in with GitHub"
    S->>G: authorize popup (client_id + PKCE challenge)
    G-->>S: code -> /github-callback.html -> postMessage
    S->>R: POST { code, code_verifier }
    R->>G: token exchange (client secret stays here)
    G-->>R: access_token
    R-->>S: access_token
    S->>G: GET /user with Bearer token
    G-->>S: login, name, avatar
    S-->>U: signed in, /dashboard
```

Security stance: the repo and the browser bundle contain **only public client ids** (Vite `VITE_*` vars). The one secret in the system lives in an untracked local file (dev) or a Worker secret (prod), never in git, never in the page.

## Pages

| Route | What it is |
|---|---|
| `/` | Warm editorial home: programs, hackathon shelves, org marquee, FAQ |
| `/organizations` + `/organizations/:login` | 43 real GitHub orgs with live stats and program participation |
| `/opensource` + `/programs/:id` | Contribo listing of 5,238 GSoC projects, filter by year/org/tech |
| `/hackathons` + `/hackathons/:id` | 161 events, deadlines, prize pools, prep playbooks, "The brief" panel |
| `/projects` | The 1,528-repo agent-skills catalog, downloadable |
| `/resources` + `/resources/:id` | 58 first-party learning resources with why/use notes |
| `/dashboard` | Signed-in home: profile, saved items, activity |
| `/nova` | nova.ai recommender - suggests skills + hackathons from your stack |
| `/repo/:id` | Repo detail with stats, tags, related projects |

## Run it locally

```bash
git clone https://github.com/adityalenova/cyrus-ai && cd cyrus-ai
npm install
cp .env.example .env          # optional - fills in public client ids
npm run dev                   # http://localhost:5330
npm run build                 # tsc --noEmit (strict, noUnusedLocals) + vite build
```

Optional pieces:

```bash
npm run gh-relay              # local GitHub token-exchange relay on :8787
                              # needs the OAuth app secret in .github-secret (untracked)
npm run refresh               # re-pull Devpost hackathons + catalog data
npm run orgs                  # regenerate realOrgs.ts from live GitHub
```

`.env` is gitignored; only these three vars exist:

```
VITE_GOOGLE_CLIENT_ID=...     # public OAuth client id
VITE_GITHUB_CLIENT_ID=...     # public OAuth app client id
VITE_GITHUB_EXCHANGE_URL=...  # relay URL (local :8787 or Cloudflare Worker)
```

## Deploy

Static build on **Vercel** - `vercel.json` carries the Vite preset and the SPA rewrite so every route resolves. Three environment variables in project settings, and both OAuth apps need the production origin registered (Google: JS origin + redirect URI; GitHub: single callback URL `<origin>/github-callback.html`).

## Tech notes

- React 19 + react-router 7, TypeScript 5 strict, Tailwind v4 (CSS-first config), Vite 6
- Zero runtime dependencies beyond React - charts, covers and the recommender are computed in-app
- Data pipeline: Node ESM scripts under `scripts/` using `gh api` and public JSON endpoints
- Warm "Contriho" design system - coffee/bean/honey/foam palette, display + mono pairing, light/dark themes

---

Private project, built by [Aditya Duggirala](https://github.com/adityalenova). All catalog numbers belong to their respective orgs and organizers; every listing links out to its official page.
