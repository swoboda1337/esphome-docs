// Downloads the referrer allowlist at build time and writes it to a JSON file that
// Astro imports. Run via the `prebuild`/`predev` npm hooks. On failure it keeps the
// existing file if there is one, otherwise it writes an empty allowlist so the
// import still resolves and the build succeeds.
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.openhomefoundation.org/allowed-referrers.json";
const OUTPUT = fileURLToPath(new URL("../src/data/allowed-referrers.json", import.meta.url));

async function main() {
  const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "esphome.io-build" } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data) || !data.every((d) => typeof d === "string")) {
    throw new Error("payload is not an array of strings");
  }
  const referrers = data.map((d) => d.trim().toLowerCase().replace(/\.$/, "")).filter((d) => d.length > 0);
  await writeFile(OUTPUT, JSON.stringify(referrers, null, 2) + "\n");
  console.log(`[allowed-referrers] wrote ${referrers.length} domains to ${OUTPUT}`);
}

main().catch(async (e) => {
  if (existsSync(OUTPUT)) {
    console.warn(`[allowed-referrers] fetch failed, keeping existing file. ${e}`);
    return;
  }
  console.warn(`[allowed-referrers] fetch failed, writing empty allowlist. ${e}`);
  await writeFile(OUTPUT, "[]\n");
});
