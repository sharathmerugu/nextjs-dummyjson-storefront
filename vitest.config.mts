import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    // Lets Testing Library register its automatic cleanup between tests.
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
