import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence monorepo workspace root warning and enable tracing for shared files
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
