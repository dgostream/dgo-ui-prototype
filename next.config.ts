/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "1";

const nextConfig = {
  // GitHub Pages resolves /join/ to /join/index.html. Without this, /join 404s.
  trailingSlash: true,
  ...(isGitHubPages
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        basePath: "/dgo-ui-prototype",
        assetPrefix: "/dgo-ui-prototype",
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;



