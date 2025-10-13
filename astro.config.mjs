import { defineConfig } from "astro/config";
import remarkMagicLinks from "./scripts/remark-magic-links.mjs";
import remarkLearningLinks from "./scripts/remark-learning-links.mjs";

// Resolve the `site` URL per-environment so redirects and generated absolute URLs
// (sitemap/canonical/etc.) use the correct host in preview and production.
function resolveSite() {
  const withProtocol = (url) =>
    typeof url === "string" && url.length > 0
      ? url.startsWith("http")
        ? url
        : `https://${url}`
      : undefined;

  // 1) Explicit override
  if (process.env.SITE_URL) return withProtocol(process.env.SITE_URL);
  if (process.env.PUBLIC_SITE_URL)
    return withProtocol(process.env.PUBLIC_SITE_URL);

  // 2) Common hosting providers
  // Vercel: VERCEL_URL is host only (e.g. my-app.vercel.app or preview host)
  if (process.env.VERCEL_URL) return withProtocol(process.env.VERCEL_URL);

  // Netlify: URL (prod) and DEPLOY_URL (preview/branch)
  if (process.env.DEPLOY_URL) return withProtocol(process.env.DEPLOY_URL);
  if (process.env.URL) return withProtocol(process.env.URL);

  // Cloudflare Pages: CF_PAGES_URL may be host-only
  if (process.env.CF_PAGES_URL) return withProtocol(process.env.CF_PAGES_URL);

  // Render: full URL
  if (process.env.RENDER_EXTERNAL_URL)
    return withProtocol(process.env.RENDER_EXTERNAL_URL);

  // 3) Fallback to production domain
  return "https://surfdeeper.com";
}

export default defineConfig({
  site: resolveSite(),
  image: {
    // Enable image optimization
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  markdown: {
    remarkPlugins: [remarkMagicLinks, remarkLearningLinks],
  },
  trailingSlash: "always",
});
