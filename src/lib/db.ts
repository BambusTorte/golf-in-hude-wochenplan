import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
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
    // ws erfüllt die WebSocket-Schnittstelle, die Typen weichen aber ab.
    neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
    // PrismaNeon erwartet eine PoolConfig ({ connectionString }), den Pool legt
    // der Adapter selbst an.
    const adapter = new PrismaNeon({ connectionString: url });
    // adapter-Option gehört zum driverAdapters-Preview; per Cast typsicher halten.
    const options = { adapter, log: ["error"] } as unknown as ConstructorParameters<
      typeof PrismaClient
    >[0];
    return new PrismaClient(options);
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
