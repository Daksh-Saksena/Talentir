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
  turbopack: {
    // pdfjs-dist tries to require 'canvas' in Node — resolve to false
    resolveAlias: {
      canvas: { browser: "./node_modules/pdfjs-dist/build/pdf.mjs" },
    },
  },
};

export default nextConfig;
