import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const parked = path.join(root, ".gh-pages-park");
const moves = [
  [path.join(root, "src", "middleware.ts"), path.join(parked, "middleware.ts")],
  [path.join(root, "src", "app", "api"), path.join(parked, "api")],
];

mkdirSync(parked, { recursive: true });

function park() {
  for (const [from, to] of moves) {
    if (!existsSync(from) || existsSync(to)) continue;
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true, force: true });
  }
}

function restore() {
  for (const [from, to] of moves) {
    if (!existsSync(to) || existsSync(from)) continue;
    cpSync(to, from, { recursive: true });
    rmSync(to, { recursive: true, force: true });
  }
}

park();
const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    GITHUB_PAGES: "1",
    NEXT_PUBLIC_BASE_PATH: "/dgo-ui-prototype",
  },
});
restore();

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const outDir = path.join(root, "out");
writeFileSync(path.join(outDir, ".nojekyll"), "");
const fallback = path.join(outDir, "index.html");
if (existsSync(fallback)) {
  writeFileSync(path.join(outDir, "404.html"), readFileSync(fallback));
}

console.log("GitHub Pages export ready in /out");
