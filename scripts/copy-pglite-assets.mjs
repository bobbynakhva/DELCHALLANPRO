import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Nitro deploys the server from .output.
// Runtime path: server/_libs/pglite.data
const destDir = join(root, ".output/server/_libs");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");

await mkdir(destDir, { recursive: true });

const names = (await readdir(srcDir)).filter(
  (name) => name.endsWith(".data") || name.endsWith(".wasm")
);

for (const name of names) {
  await copyFile(join(srcDir, name), join(destDir, name));
}

console.log(`Copied ${names.length} PGLite asset(s) to ${destDir}`);
