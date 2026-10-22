import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  distDir: process.env.ARENA_DEPLOYMENT === 'docker' ? '.next-docker' : '.next-vercel',
  ...(process.env.ARENA_DEPLOYMENT === 'docker' ? { output: 'standalone' as const } : {}),
  outputFileTracingIncludes: { '/auth.css': ['./docker/auth.css'] },
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^@\/lib\/platform$/, path.resolve(process.env.ARENA_DEPLOYMENT === 'docker' ? 'lib/platform-docker.ts' : 'lib/platform-vercel.ts')),
      ...(process.env.ARENA_DEPLOYMENT === 'docker' ? [] : [new webpack.NormalModuleReplacementPlugin(/^@\/lib\/auth-platform$/, path.resolve('lib/auth-vercel.ts'))]),
    );
    return config;
  },
};

export default nextConfig;
