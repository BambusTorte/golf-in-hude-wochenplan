/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer", "@node-rs/argon2", "node-ical"],
  eslint: {
    // Linting runs as a separate CI step (`npm run lint`); do not fail the build on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
