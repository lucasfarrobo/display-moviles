import { mkdirSync, writeFileSync } from "fs";
import { getMobilesFromSheets } from "../lib/sheets";

async function main() {
  const data = await getMobilesFromSheets();
  mkdirSync("public/data", { recursive: true });
  writeFileSync("public/data/mobiles.json", JSON.stringify(data, null, 2));
  console.log(`[fetch-data] ${data.mobiles.length} móviles → public/data/mobiles.json`);
}

main().catch((err) => {
  console.error("[fetch-data] Error:", err);
  process.exit(1);
});
