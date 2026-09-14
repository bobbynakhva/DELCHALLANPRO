#!/usr/bin/env node
/** npm run backup — timestamped zip (IST). Schema + docs + last journey stamp. */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})
  .formatToParts(new Date())
  .reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, /** @type {Record<string, string>} */ ({}));
const ist = `${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}`;

const dir = join(process.cwd(), "artifacts");
mkdirSync(dir, { recursive: true });
const dest = join(dir, `tamba-backup-${ist}-IST.zip`);
const manifest = {
  at: new Date().toISOString(),
  ist,
  plantTarget: "postgres",
  demoEngine: "pglite (Postgres WASM, not SQLite)",
};
writeFileSync(join(dir, "backup-manifest.json"), JSON.stringify(manifest, null, 2));

const files = ["migrations", "docs", "artifacts/journeys-last.json", "artifacts/backup-manifest.json"];
if (existsSync("README.md")) files.push("README.md");

const py = `
import zipfile, os
dest = ${JSON.stringify(dest)}
roots = ${JSON.stringify(files)}
n = 0
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
    for root in roots:
        if os.path.isfile(root):
            z.write(root)
            n += 1
            continue
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for fn in filenames:
                path = os.path.join(dirpath, fn)
                z.write(path)
                n += 1
print(dest)
print(n)
`;
const r = spawnSync("python3", ["-c", py], { cwd: process.cwd(), encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.error);
  process.exit(r.status || 1);
}
if (!existsSync(dest) || statSync(dest).size < 100) {
  console.error("backup zip missing or empty", dest, r.stdout, r.stderr);
  process.exit(1);
}
process.stdout.write(r.stdout);
