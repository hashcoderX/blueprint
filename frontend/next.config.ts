import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence monorepo workspace root warning and enable tracing for shared files
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  async headers() {
    return [
      {
        // Static assets: allow long-term caching
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // All other routes (HTML): avoid stale content after deploy
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
