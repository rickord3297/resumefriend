import type { NextConfig } from "next";

/** Set to "1" in Vercel (Production) to send `/` to the Entity Mapping waitlist landing. */
const landingAtRoot = process.env.LANDING_AT_ROOT === "1";

const nextConfig: NextConfig = {
  async redirects() {
    if (!landingAtRoot) return [];
    return [{ source: "/", destination: "/waitlist", permanent: false }];
  },
};

export default nextConfig;
