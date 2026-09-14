#!/usr/bin/env node
/**
 * npm run journeys — load the pack through Vite so import.meta.glob and @/
 * aliases work. A NEW process gets a FRESH in-memory PGLite, applies
 * migrations, seeds, then posts journeys 1–32 via posting.ts (foundry 22–27, cutover 28–32).
 */
import { createServer } from "vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const vite = await createServer({
  root,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  clearScreen: false,
  logLevel: "error",
});

try {
  const mod = await vite.ssrLoadModule("/src/modules/journeys/pack.ts");
  const report = await mod.runJourneys();
  for (const s of report.steps) {
    const mark = s.pass ? "PASS" : "FAIL";
    console.log(`${mark}  ${s.n}. ${s.title}${s.note ? " — " + s.note : ""}`);
  }
  console.log(`${report.passed}/${report.steps.length} PASS`);
  process.exit(report.failed ? 1 : 0);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await vite.close();
}
