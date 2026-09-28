import { defineConfig, exports } from 'cf/config';
import * as entrypoint from './src/worker.js' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'prerender-durable-object',
		compatibilityDate: '2026-01-28',
		entrypoint,
		compatibilityFlags: ['nodejs_compat'],
		exports: {
			ExampleDO: exports.durableObject({ storage: 'sqlite' }),
		},
	},
});
