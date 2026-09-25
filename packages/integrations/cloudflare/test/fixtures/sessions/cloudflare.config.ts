import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
	worker: {
		name: 'astro-cf-session',
		compatibilityDate: '2026-01-28',
		observability: {
			enabled: true,
		},
		env: {
			ASSETS: bindings.assets(),
		},
	},
});
