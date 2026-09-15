/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 writes AGENTS.md / CLAUDE.md on `next dev` unless this is off.
  agentRules: false,
  async redirects() {
    return [
      { source: "/merge", destination: "/tools", permanent: true },
      { source: "/merge/:path*", destination: "/tools/:path*", permanent: true },
    ];
  },
};

module.exports = nextConfig;
