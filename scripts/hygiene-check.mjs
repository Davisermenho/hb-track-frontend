import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const banned = [
  { re: /\bcatch\s*\(\s*error\s*:\s*any\s*\)/, label: "catch(error: any)" },
  { re: /\b:\s*any\b/, label: "explicit ': any'" },
  { re: /\bas\s+any\b/, label: "'as any' cast" },
  { re: /\bdata\?\s*:\s*any\b/, label: "data?: any" },
  { re: /\bresult\s*:\s*any\b/, label: "result: any" },
];

// Allow escape hatch per-line: add comment `// @allow-any`
const ALLOW = /@allow-any/;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function checkFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW.test(line)) continue;

    for (const rule of banned) {
      if (rule.re.test(line)) {
        issues.push({ file, line: i + 1, label: rule.label, snippet: line.trim() });
      }
    }
  }
  return issues;
}

if (!fs.existsSync(SRC)) {
  console.error(`hygiene-check: src/ not found at ${SRC}`);
  process.exit(2);
}

const files = walk(SRC);
let all = [];
for (const f of files) all = all.concat(checkFile(f));

if (all.length) {
  console.error(`hygiene-check: found ${all.length} issue(s)\n`);
  for (const it of all) {
    const rel = path.relative(ROOT, it.file);
    console.error(`${rel}:${it.line}  ${it.label}\n  ${it.snippet}\n`);
  }
  process.exit(1);
}

console.log("hygiene-check: OK");