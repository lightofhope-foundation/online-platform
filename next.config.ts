import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://assets.mediadelivery.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; media-src 'self' blob: data: https://vz-f7a686f2-d74.b-cdn.net https://*.b-cdn.net; frame-src 'self' https://iframe.mediadelivery.net;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
