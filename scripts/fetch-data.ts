import { mkdirSync, writeFileSync } from "fs";
import { slimMobilesResponse, buildMobileSummary } from "../lib/exportPayload";
import { getMobilesFromSheets } from "../lib/sheets";

async function main() {
  const data = await getMobilesFromSheets();
  const payload = slimMobilesResponse(data);
  mkdirSync("public/data", { recursive: true });
  const json = JSON.stringify(payload);
  writeFileSync("public/data/mobiles.json", json);
  const summary = JSON.stringify(buildMobileSummary(payload));
  writeFileSync("public/data/mobiles-summary.json", summary);
  const kb = Math.round(json.length / 1024);
  const summaryKb = Math.round(summary.length / 1024);
  console.log(
    `[fetch-data] ${payload.mobiles.length} móviles → public/data/mobiles.json (${kb} KB), summary (${summaryKb} KB)`
  );
}

main().catch((err) => {
  console.error("[fetch-data] Error:", err);
  process.exit(1);
});
