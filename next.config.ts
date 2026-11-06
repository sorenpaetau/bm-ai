import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photo uploads go through a server action. The browser shrinks them first, so this is headroom.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
