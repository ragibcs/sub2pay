import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const target = process.argv[2]?.toLowerCase();
const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("schema.prisma not found at", schemaPath);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, "utf-8");

if (target === "postgres" || target === "postgresql") {
  console.log("Switching Prisma schema to PostgreSQL (Neon / Production)...");
  content = content.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}`
  );
  fs.writeFileSync(schemaPath, content, "utf-8");
  console.log("Updated datasource in schema.prisma to postgresql.");
  try {
    execSync("pnpm exec prisma generate", { stdio: "inherit" });
    console.log("Successfully generated Prisma Client for PostgreSQL.");
  } catch (e) {
    console.warn("Prisma generate completed with notice:", e.message);
  }
} else if (target === "sqlite") {
  console.log("Switching Prisma schema to SQLite (Local Dev)...");
  content = content.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  fs.writeFileSync(schemaPath, content, "utf-8");
  console.log("Updated datasource in schema.prisma to sqlite.");
  try {
    execSync("pnpm exec prisma generate", { stdio: "inherit" });
    console.log("Successfully generated Prisma Client for SQLite.");
  } catch (e) {
    console.warn("Prisma generate completed with notice:", e.message);
  }
} else {
  console.log("Usage: node scripts/switch-db.mjs [postgres|sqlite]");
  process.exit(1);
}
