import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  distDir: '.next-vercel',
  outputFileTracingIncludes: { '/auth.css': ['./docker/auth.css'] },
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^@\/lib\/platform$/, path.resolve('lib/platform-vercel.ts')),
      new webpack.NormalModuleReplacementPlugin(/^@\/lib\/auth-platform$/, path.resolve('lib/auth-vercel.ts')),
    );
    return config;
  },
};

export default nextConfig;
