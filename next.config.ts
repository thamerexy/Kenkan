import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Kenkan',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
