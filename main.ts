// Leonida Trophy Ledger — entry program.
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from the
// kit's vendored frontend library. Node 22, standard library only.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = new URL(".", import.meta.url).pathname;
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outputDir, { recursive: true });

for (const name of ["app", "screenshots"]) {
  const target = join(outputDir, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  cpSync(join(repoRoot, name), target, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log("Wrote " + join(outputDir, "dossier.json"));
