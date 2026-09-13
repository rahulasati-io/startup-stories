import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity already serves resized CDN images. Loading them directly also avoids
    // local DNS/NAT64 addresses being rejected by Next.js' image proxy.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
