/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "1";
const pagesBasePath = isGitHubPages ? "/dgo-ui-prototype" : "";

const nextConfig = {
  // GitHub Pages resolves /join/ to /join/index.html. Without this, /join 404s.
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: pagesBasePath,
  },
  ...(isGitHubPages
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;



