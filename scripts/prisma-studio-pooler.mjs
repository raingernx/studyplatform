import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import dotenv from "dotenv";

const root = process.cwd();
const env = { ...process.env };

for (const fileName of [".env", ".env.local"]) {
  const filePath = resolve(root, fileName);

  if (existsSync(filePath)) {
    Object.assign(env, dotenv.parse(readFileSync(filePath)));
  }
}

if (!env.DATABASE_URL) {
  console.error(
    "[db:studio:pooler] DATABASE_URL is required to open Prisma Studio through the Supabase pooler.",
  );
  process.exit(1);
}

// Prisma Studio can prefer directUrl from schema.prisma; use the pooler locally
// when direct 5432 access is blocked by the current network.
env.DIRECT_URL = env.DATABASE_URL;

const prismaBin = process.platform === "win32" ? "prisma.cmd" : "prisma";
const prismaPath = join(root, "node_modules", ".bin", prismaBin);
const child = spawn(prismaPath, ["studio"], {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
