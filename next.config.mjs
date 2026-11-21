import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Deixa abrir o servidor de desenvolvimento por um endereço público de túnel (celular, Agora).
  allowedDevOrigins: ['*.lhr.life', '*.localhost.run', '*.ngrok-free.dev', '*.trycloudflare.com'],
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDir,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
