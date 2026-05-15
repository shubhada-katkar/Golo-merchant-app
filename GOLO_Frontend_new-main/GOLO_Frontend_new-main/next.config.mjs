/** @type {import('next').NextConfig} */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://golo-backend-new.onrender.com';

const nextConfig = {
  // Use standalone output for smaller production image
  output: 'standalone',
  reactCompiler: true,
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    domains: ['localhost'],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
