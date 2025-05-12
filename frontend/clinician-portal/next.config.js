/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'healthlinc.app'],
  },
  async rewrites() {
    return [
      {
        source: '/api/fhir/:path*',
        destination: `${process.env.FHIR_API_URL || 'http://localhost:8000/fhir'}/:path*`,
      },
      {
        source: '/api/mcp/:path*',
        destination: `${process.env.MCP_API_URL || 'http://localhost:8787'}/query/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${process.env.AUTH_API_URL || 'http://localhost:3003'}/agents/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
