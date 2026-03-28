import type { NextConfig } from "next";

/**
 * `/` → `/waitlist` when:
 * - `LANDING_AT_ROOT=1`, or
 * - building on Vercel (`VERCEL=1`) and not opted out with `LANDING_AT_ROOT=0`.
 * Local `next dev` without those vars keeps `/` as the app (see `(shell)/page.tsx`).
 */
const onVercel = process.env.VERCEL === "1";
const landingAtRoot =
  process.env.LANDING_AT_ROOT === "1" ||
  (onVercel && process.env.LANDING_AT_ROOT !== "0");

const nextConfig: NextConfig = {
  async redirects() {
    if (!landingAtRoot) return [];
    return [{ source: "/", destination: "/waitlist", permanent: false }];
  },
};

export default nextConfig;
