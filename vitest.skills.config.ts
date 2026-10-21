import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['.agents/evals/**/*.eval.ts'],
		fileParallelism: false,
		hookTimeout: 60_000,
		maxConcurrency: 1,
		testTimeout: 600_000,
	},
});
