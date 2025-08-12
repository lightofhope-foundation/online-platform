import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
