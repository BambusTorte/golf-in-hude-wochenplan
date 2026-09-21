/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@node-rs/argon2",
    "node-ical",
    "@prisma/client",
    ".prisma/client",
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
