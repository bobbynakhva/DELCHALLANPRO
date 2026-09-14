import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");

await mkdir(destDir, { recursive: true });
const names = (await readdir(srcDir)).filter((n) => n.endsWith(".data") || n.endsWith(".wasm"));
for (const name of names) {
  await copyFile(join(srcDir, name), join(destDir, name));
}
