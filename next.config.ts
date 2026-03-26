import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker multi-stage build
  allowedDevOrigins: ['localhost:3001', '127.0.0.1:3001'],
};

export default nextConfig;
