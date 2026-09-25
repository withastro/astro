import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from './src/worker.ts' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'astro-cloudflare-custom-entryfile-fetch-state',
		compatibilityDate: '2026-01-28',
		entrypoint,
		assets: {
			runWorkerFirst: true,
		},
		env: {
			ASSETS: bindings.assets(),
		},
	},
});
