import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phet.colorado.edu",
      },
    ],
  },
};

export default nextConfig;
