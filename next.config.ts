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
  // Allow NCERT PDFs to be embedded via <object> tags from the browser
  async headers() {
    return [
      {
        source: "/api/pdf-proxy",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  webpack(config) {
    // pdfjs-dist ships its own worker — tell webpack to treat it as an asset
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false, // pdfjs tries to require canvas in Node; ignore it
    };
    return config;
  },
};

export default nextConfig;
