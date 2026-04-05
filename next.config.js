/** @type {import('next').NextConfig} */

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3900';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${NEXT_PUBLIC_API_URL}/api/:path*`,
        },
        {
          source: '/socket.io/:path*',
          destination: `${NEXT_PUBLIC_API_URL}/socket.io/:path*`,
        },
        {
          source: '/socket.io',
          destination: `${NEXT_PUBLIC_API_URL}/socket.io`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
