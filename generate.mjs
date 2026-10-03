#!/usr/bin/env node
// v2: merge extended GitHub dumps into data.js (adds forks/lang/license/issues/updated/home)
import { readdirSync, readFileSync, writeFileSync } from "fs";

const files = readdirSync(".rawdata").filter((f) => f.startsWith("x_") && f.endsWith(".json"));
const byName = new Map();

function parseObjs(raw) {
  const objs = []; let depth = 0, cur = "";
  for (const ch of raw) {
    if (ch === "{") { depth++; cur += ch; continue; }
    if (ch === "}") { depth--; cur += ch; if (depth === 0) { objs.push(cur); cur = ""; } continue; }
    if (depth > 0) cur += ch;
  }
  return objs;
}
for (const f of files) {
  for (const o of parseObjs(readFileSync(`.rawdata/${f}`, "utf8"))) {
    try {
      const r = JSON.parse(o);
      if (!r.name || typeof r.stars !== "number") continue;
      const prev = byName.get(r.name);
      if (!prev || r.stars > prev.stars) byName.set(r.name, r);
    } catch {}
  }
}

const CURATED_CAT = {
  "obra/superpowers": "skills", "anthropics/skills": "skills", "anthropics/claude-code": "tools",
  "wshobson/agents": "skills", "VoltAgent/awesome-claude-code-subagents": "skills",
  "hesreallyhim/awesome-claude-code": "skills", "davila7/claude-code-templates": "skills",
  "PatrickJS/awesome-cursorrules": "cursor", "modelcontextprotocol/servers": "mcp",
  "punkpeye/awesome-mcp-servers": "mcp", "microsoft/playwright-mcp": "mcp",
  "github/github-mcp-server": "mcp", "PrefectHQ/fastmcp": "mcp",
  "VoltAgent/awesome-design-md": "agentsmd", "google-labs-code/design.md": "agentsmd",
  "agentsmd/agents.md": "agentsmd", "microsoft/SkillOpt": "agentsmd",
  "openai/codex": "tools", "google-gemini/gemini-cli": "tools", "anomalyco/opencode": "tools",
  "OpenHands/OpenHands": "tools", "cline/cline": "tools", "microsoft/autogen": "tools",
  "crewAIInc/crewAI": "tools", "Aider-AI/aider": "tools", "aaif-goose/goose": "tools",
  "langchain-ai/langgraph": "tools", "continuedev/continue": "tools",
  "openai/openai-agents-python": "tools", "Kilo-Org/kilocode": "tools", "RooCodeInc/Roo-Code": "tools",
};

function classify(r) {
  if (CURATED_CAT[r.name]) return CURATED_CAT[r.name];
  const t = (r.topics || []).map((x) => x.toLowerCase());
  const blob = (r.name + " " + (r.desc || "")).toLowerCase();
  if (t.includes("cursorrules") || /cursor\s*-?\s*rules?|\.cursorrules|cursorrule/.test(blob)) return "cursor";
  if (t.some((x) => ["mcp", "mcp-server", "model-context-protocol"].includes(x))) return "mcp";
  if (t.some((x) => ["agents-md", "agent-md", "design-md"].includes(x)) || /agents\.md/.test(blob)) return "agentsmd";
  if (t.some((x) => ["agent-skills", "claude-skills", "claude-code-skills", "skills", "claude-subagents", "subagents", "agent-plugins"].includes(x))) return "skills";
  if (t.includes("agentic-workflow")) return "tools";
  if (blob.includes("skill")) return "skills";
  return "tools";
}

const LICENSE_FIX = { NOASSERTION: "Custom", null: "—" };
let repos = [...byName.values()]
  .filter((r) => r.stars >= 25 && r.desc)
  .map((r) => ({
    cat: classify(r),
    repo: r.name,
    stars: r.stars,
    forks: r.forks || 0,
    issues: r.issues || 0,
    lang: r.lang || "—",
    license: LICENSE_FIX[r.license] || r.license || "—",
    updated: (r.updated || "").slice(0, 10),
    home: r.home || "",
    url: r.url,
    desc: r.desc.length > 240 ? r.desc.slice(0, 237) + "…" : r.desc,
    tags: (r.topics || []).slice(0, 5),
  }))
  .sort((a, b) => b.stars - a.stars);

const cap = { skills: 220, mcp: 150, cursor: 60, agentsmd: 50, tools: 80 };
const seen = {};
repos = repos.filter((r) => { seen[r.cat] = (seen[r.cat] || 0) + 1; return seen[r.cat] <= cap[r.cat]; });

const cats = [
  { id: "all", label: "Everything" },
  { id: "skills", label: "Agent Skills" },
  { id: "cursor", label: "Cursor Rules" },
  { id: "agentsmd", label: "AGENTS.md & Design.md" },
  { id: "mcp", label: "MCP Servers" },
  { id: "tools", label: "Dev Agents & Programs" },
];

writeFileSync("data.js",
  "// cyrus.ai data — GitHub API snapshot 2026-10-02 (extended: forks/lang/license/issues)\n" +
  "const CATEGORIES = " + JSON.stringify(cats) + ";\n" +
  "const REPOS = [\n" + repos.map((r) => JSON.stringify(r)).join(",\n") + "\n];\n", "utf8");

const counts = {};
repos.forEach((r) => (counts[r.cat] = (counts[r.cat] || 0) + 1));
console.log(`data.js v2: ${repos.length} repos`, JSON.stringify(counts));
