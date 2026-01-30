import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    environmentMatchGlobs: [
      ["src/lib/auth.test.ts", "node"],
      ["src/lib/invites.firstuser.test.ts", "node"],
    ],
    env: {
      JWT_SECRET: "test-secret-for-vitest",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
