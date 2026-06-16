// Swap prisma/schema.prisma datasource provider from sqlite -> postgresql.
// Run during Vercel build or before deploy:  node scripts/switch-to-postgres.mjs
import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
let content = readFileSync(path, "utf-8");

if (content.includes('provider = "postgresql"')) {
  console.log("[switch-to-postgres] schema already uses postgresql — no change");
  process.exit(0);
}

content = content.replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync(path, content);
console.log("[switch-to-postgres] schema datasource flipped to postgresql");
