import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Only DummyJSON's image CDN may be optimised through this app.
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com", pathname: "/product-images/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
