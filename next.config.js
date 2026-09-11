/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/merge", destination: "/tools", permanent: true },
      { source: "/merge/:path*", destination: "/tools/:path*", permanent: true },
    ];
  },
};

module.exports = nextConfig;
