/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,js}", "tests/**/*.spec.{ts,js}"],
    globals: false,
  },
});
