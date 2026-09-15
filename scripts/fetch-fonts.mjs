// Downloads the licensed brand fonts (Montserrat Arabic, Basis Grotesque
// Arabic Pro) from a private Supabase Storage bucket into src/fonts/, so the
// commercial font files never have to be committed to git.
//
// Runs automatically before `next build` (see the "prebuild" script in
// package.json). Locally it's a near-instant no-op once the files already
// exist on disk -- only a fresh clone or a clean Vercel build actually hits
// the network.
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "fonts";

const FILES = [
  "montserrat-arabic/Montserrat-Arabic-SemiBold-600.otf",
  "montserrat-arabic/Montserrat-Arabic-Bold-700.otf",
  "montserrat-arabic/Montserrat-Arabic-ExtraBold-800.otf",
  "basis-grotesque-arabic/BasisGrotesqueArabicPro-Regular-400.ttf",
  "basis-grotesque-arabic/BasisGrotesqueArabicPro-Medium-500.ttf",
  "basis-grotesque-arabic/BasisGrotesqueArabicPro-Bold-700.ttf",
];

function loadEnv() {
  // Vercel injects env vars directly into process.env at build time; this
  // .env.local fallback is only for running the script locally.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  const missing = FILES.filter((f) => !existsSync(join(ROOT, "src/fonts", f)));
  if (missing.length === 0) {
    console.log("fetch-fonts: all font files already present, skipping.");
    return;
  }

  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn(
      "fetch-fonts: missing font files and no Supabase credentials to fetch them " +
        `(${missing.join(", ")}). Build will fail if these aren't provided another way.`
    );
    return;
  }

  const admin = createClient(url, serviceKey);
  console.log(`fetch-fonts: downloading ${missing.length} font file(s) from the private "${BUCKET}" bucket...`);

  for (const relPath of missing) {
    const { data, error } = await admin.storage.from(BUCKET).download(relPath);
    if (error) throw new Error(`Failed to download ${relPath}: ${error.message}`);

    const destPath = join(ROOT, "src/fonts", relPath);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, Buffer.from(await data.arrayBuffer()));
    console.log(`  fetched ${relPath}`);
  }

  console.log("fetch-fonts: done.");
}

main().catch((err) => {
  console.error("fetch-fonts failed:", err);
  process.exit(1);
});
