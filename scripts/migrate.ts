import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../src/lib/db";

async function main() {
  await sql.unsafe(readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8"));
  console.log("Schema applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
