/** @type {import('next').NextConfig} */
const APK_RELEASE_URL =
  "https://github.com/Kbueno1077/olympus-dominoes/releases/download/android-4.9/olympus-dominoes.v4.9.apk";

const nextConfig = {
  // Next 16 writes AGENTS.md / CLAUDE.md on `next dev` unless this is off.
  agentRules: false,
  async redirects() {
    const rules = [
      { source: "/merge", destination: "/tools", permanent: true },
      { source: "/merge/:path*", destination: "/tools/:path*", permanent: true },
    ];
    // 174MB APK cannot ship in the Vercel deployment. Local `next dev` serves
    // `public/downloads/`; production 302s the same path to the GitHub Release.
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      rules.push({
        source: "/downloads/olympus-dominoes.v4.9.apk",
        destination: APK_RELEASE_URL,
        permanent: false,
      });
    }
    return rules;
  },
};

module.exports = nextConfig;
