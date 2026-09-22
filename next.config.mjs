/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @neondatabase/serverless, ws und der Adapter werden bewusst NICHT external
  // gehalten, damit sie sicher ins Serverless-Bundle gelangen (sonst 502 durch
  // fehlende Auflösung zur Laufzeit).
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@node-rs/argon2",
    "node-ical",
    "@prisma/client",
  ],
  // Prisma-Query-Engine (Binärdatei) zwingend ins Serverless-Function-Bundle
  // aufnehmen – sonst 502 zur Laufzeit auf Netlify/Lambda.
  outputFileTracingIncludes: {
    "**": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
  eslint: {
    // Linting runs as a separate CI step (`npm run lint`); do not fail the build on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
