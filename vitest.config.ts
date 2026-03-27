import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["app/api/auth/**/*.ts", "lib/**/*.ts"],
      exclude: ["lib/prisma.ts"],
    },
  },
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
});
