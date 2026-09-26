import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	env: {
		schema: {
			REQUIRED: envField.string({
				access: 'secret',
				context: 'server',
			}),
		},
	},
	output: 'server',
	adapter: node({
		mode: 'standalone',
		experimentalExitMissingVarEnv: true,
	}),
});
