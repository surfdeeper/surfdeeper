import { defineConfig } from "astro/config";
import remarkMagicLinks from "./scripts/remark-magic-links.mjs";
import remarkLearningLinks from "./scripts/remark-learning-links.mjs";

export default defineConfig({
  site: "https://surfdeeper.com",
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
});
