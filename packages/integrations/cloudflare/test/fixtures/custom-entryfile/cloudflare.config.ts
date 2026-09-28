import {
	bindings,
	defineConfig,
	exports,
	triggers,
} from 'cf/config';
import * as entrypoint from './src/worker.ts' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'astro-cloudflare-custom-entryfile',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			ASSETS: bindings.assets(),
			MY_QUEUE: bindings.queue({ name: 'MY-QUEUE-NAME' }),
		},
		triggers: [
			triggers.queue({ name: 'MY-QUEUE-NAME', maxBatchSize: 10, maxBatchTimeout: 5 }),
		],
		exports: {
			MyDurableObject: exports.durableObject({ storage: 'sqlite' }),
		},
	},
});
