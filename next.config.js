/** @type {import('next').NextConfig} */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3900';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // REST API proxy → backend
        {
          source: '/api/:path*',
          destination: `${BACKEND_URL}/api/:path*`,
        },
        // WebSocket upgrade proxy → backend (Vercel edge handles WS upgrades)
        {
          source: '/ws',
          destination: `${BACKEND_URL}/ws`,
        },
        {
          source: '/ws/:path*',
          destination: `${BACKEND_URL}/ws/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
