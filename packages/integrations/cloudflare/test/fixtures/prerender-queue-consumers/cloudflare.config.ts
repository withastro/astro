import {
	bindings,
	defineConfig,
	triggers,
} from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'prerender-queue-consumers',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			MY_QUEUE: bindings.queue({ name: 'my-queue' }),
		},
		triggers: [triggers.queue({ name: 'my-queue' })],
	},
});
