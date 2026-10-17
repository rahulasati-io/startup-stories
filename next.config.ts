import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/people/jamsetji-nusserwanji-tata",
        destination: "/people/jamsetji-tata",
        permanent: true,
      },
      {
        source: "/articles/quanfluence-quantum-computer-funding%20%20%20Copy",
        destination: "/articles/quanfluence-quantum-computer-funding",
        permanent: true,
      },
    ];
  },
  images: {
    // Responsive Sanity CDN variants, without the server-side image proxy.
    loader: "custom",
    loaderFile: "./lib/sanity-image-loader.mjs",
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
