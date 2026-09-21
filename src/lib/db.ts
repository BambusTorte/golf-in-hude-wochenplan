import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

/**
 * Prisma-Client als Singleton.
 * - Produktion mit Neon (DATABASE_URL enthält "neon.tech"): Neon-Serverless-
 *   Treiber über einen Driver-Adapter. Die DB-Verbindung läuft über WebSocket
 *   statt über eine native TCP/TLS-Verbindung – das vermeidet die 502-Abstürze
 *   der nativen Query-Engine auf Netlify/AWS-Lambda.
 * - Lokale Entwicklung (localhost-Postgres): Standard-Prisma-Client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  if (/neon\.tech/i.test(url)) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: ["error"] });
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
