import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	env: {
		schema: {
			API_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
			API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
		},
	},
	vite: {
		envPrefix: ['PUBLIC_', 'API_'],
	},
});
