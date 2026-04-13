import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Inject manifest is required for Firebase Messaging env vars to be available in the worker
  // but next.config.ts usually handles defining them for the build.
  // We can pass additional webpack config if needed.
});

const nextConfig: NextConfig = {
  // Your existing Next.js config
  experimental: {
    // Next.js 16 specific experimental flags if needed
  },
};

export default withSerwist(nextConfig);
