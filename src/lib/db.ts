import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

/**
 * Prisma-Client als Singleton.
 * - Produktion mit Neon (DATABASE_URL enthält "neon.tech"): reiner HTTP-Adapter
 *   (PrismaNeonHTTP). Jede Abfrage ist ein zustandsloser HTTPS-Request – das ist
 *   auf Netlify/AWS-Lambda stabil (der WebSocket-Treiber hängt dort). Der Code
 *   verwendet bewusst KEINE Transaktionen (HTTP-Treiber unterstützt keine).
 * - Lokale Entwicklung (localhost-Postgres): Standard-Prisma-Client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  if (/neon\.tech/i.test(url)) {
    const adapter = new PrismaNeonHTTP(url, {});
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
