import { defineConfig } from "astro/config";

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
});
