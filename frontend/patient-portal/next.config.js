/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // In development, proxy API requests to the backend
      {
        source: '/api/fhir/:path*',
        destination: process.env.FHIR_API_URL || 'http://localhost:8000/fhir/:path*',
      },
      {
        source: '/api/mcp/:path*',
        destination: process.env.MCP_API_URL || 'http://localhost:8787/query',
      },
    ];
  },
  images: {
    domains: ['healthlinc.app', 'localhost'],
  },
};

module.exports = nextConfig;
