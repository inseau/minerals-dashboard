import type { NextConfig } from "next";

// The entire app is client-rendered and reads pre-computed JSON from /public/data,
// so it can ship as a fully static site — trivial to self-host (any static file
// host / nginx / GitHub Pages) or deploy to Vercel with zero server functions.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
