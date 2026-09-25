import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'test',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			KV: bindings.kv({ id: '<YOUR_ID>' }),
			KV_PROD: bindings.kv({ id: '<YOUR_ID>' }),
			COOL: bindings.text('ME'),
			D1: bindings.d1({ id: '<unique-ID-for-your-database>', name: '<DATABASE_NAME>' }),
			D1_PROD: bindings.d1({ id: '<unique-ID-for-your-database>', name: '<DATABASE_NAME>' }),
			R2: bindings.r2({ name: 'your-bucket-name' }),
			R2_PROD: bindings.r2({ name: 'your-bucket-name' }),
		},
	},
});
