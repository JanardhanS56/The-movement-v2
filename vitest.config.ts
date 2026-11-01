import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    testTimeout: 15000,
    env: {
      NEXT_PUBLIC_USE_MOCKS: "true",
    },
  },
})
