import type { AstroIntegration } from 'astro';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Reference: https://docs.astro.build/en/reference/integrations-reference/
export default {
	name: 'my-astro-integration',
	hooks: {
		'astro:config:setup': ({ addDevToolbarApp }) => {
			addDevToolbarApp({
				id: 'my-toolbar-app',
				name: 'My Toolbar App',
				icon: '🚀',
				entrypoint: join(__dirname, './app.js'),
			});
		},
	},
} satisfies AstroIntegration;
