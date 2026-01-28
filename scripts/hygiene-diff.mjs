import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

// Fail only on changed files (regression guard).
function changedFiles() {
  const cmd = "git diff --name-only --diff-filter=ACMR";
  const out = execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);

  return out
    .filter((f) => f.startsWith("src/") && /\.(ts|tsx)$/.test(f))
    .map((f) => path.join(ROOT, f));
}

const banned = [
  // Legacy imports (freeze enforcement)
  { re: /@\/components\/teams\//, label: "legacy import: @/components/teams/* (use teams-v2)" },
  { re: /@\/components\/competitions\//, label: "legacy import: @/components/competitions/* (use competitions-v2)" },

  // Boundary + typing regressions
  { re: /\bcatch\s*\(\s*error\s*:\s*any\s*\)/, label: "catch(error: any) — use unknown + narrowing" },
  { re: /\bas\s+any\b/, label: "'as any' cast — must be justified; prefer typed cast (not any)" },
  { re: /\bzodResolver\([^)]+\)\s*as\s*any\b/, label: "zodResolver(...) as any — replace with typed resolver" },

  // fetch usage outside api client
  { re: /\bfetch\s*\(/, label: "direct fetch() — only allowed in src/lib/api/client.ts" },
];

// Escape hatch per-line: `// @allow-hygiene`
const ALLOW = /@allow-hygiene/;

function checkFile(file) {
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const issues = [];

  const isApiClient = rel === "src/lib/api/client.ts";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW.test(line)) continue;

    for (const rule of banned) {
      if (rule.label.includes("fetch()") && isApiClient) continue; // allow fetch in api client
      if (rule.re.test(line)) {
        issues.push({ file: rel, line: i + 1, label: rule.label, snippet: line.trim() });
      }
    }
  }
  return issues;
}

if (!fs.existsSync(SRC)) {
  console.error(`hygiene-diff: src/ not found at ${SRC}`);
  process.exit(2);
}

let files = [];
try {
  files = changedFiles();
} catch {
  console.error("hygiene-diff: git not available or not a git repo. Skipping.");
  process.exit(0);
}

if (!files.length) {
  console.log("hygiene-diff: no changed TS/TSX files.");
  process.exit(0);
}

let all = [];
for (const f of files) all = all.concat(checkFile(f));

if (all.length) {
  console.error(`hygiene-diff: found ${all.length} issue(s)\n`);
  for (const it of all) {
    console.error(`${it.file}:${it.line}  ${it.label}\n  ${it.snippet}\n`);
  }
  process.exit(1);
}

console.log("hygiene-diff: OK");