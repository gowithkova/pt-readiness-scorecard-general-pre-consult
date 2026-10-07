import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is fully dynamic (authenticated, per-household data), so Cache
     Components' static-shell model doesn't apply — every route would need
     Suspense boundaries purely to satisfy the build, not for real benefit. */
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
