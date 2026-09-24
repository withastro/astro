import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'astro-cloudflare-custom-entryfile',
		compatibilityDate: '2026-01-28',
		entrypoint,
		compatibilityFlags: ['global_fetch_strictly_public'],
		env: {
			ASSETS: bindings.assets(),
			IMAGES: bindings.images(),
			SESSION: bindings.kv({ id: 'SESSION' }),
			FOO: bindings.text('foo'),
			BAR: bindings.text('bar'),
			SECRET: bindings.secret(),
		},
	},
});
