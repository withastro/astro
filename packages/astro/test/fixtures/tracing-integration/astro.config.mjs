import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		enableTracing: true,
	},
	integrations: [{
		name: 'tracing-test',
		hooks: {
			'astro:config:setup': ({ experimental_addInitializer }) => {
				experimental_addInitializer('./src/tracing.ts');
			},
		},
	}],
});
