import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		exclude: ["**/node_modules/**", "**/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/server/domain/**", "src/lib/validations/**"],
			thresholds: {
				lines: 80,
				functions: 80,
			},
		},
	},
});
