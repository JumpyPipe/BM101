import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode indicator badge overlaps the mobile header/bottom-tab-bar
  // at every corner on a small viewport; it's dev-only chrome, not part of
  // the shipped app, so turn it off rather than picking a "least-bad" spot.
  devIndicators: false,
  // Required for Prisma Compute (and most non-Vercel Node hosts): produces
  // a self-contained server.js instead of relying on `next start` + the
  // full node_modules tree.
  output: "standalone",
};

export default nextConfig;
