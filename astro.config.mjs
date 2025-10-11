import { defineConfig } from "astro/config";
import remarkMagicLinks from "./scripts/remark-magic-links.mjs";

export default defineConfig({
  site: "https://surfdeeper.com",
  markdown: {
    remarkPlugins: [remarkMagicLinks],
  },
});
