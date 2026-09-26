// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		{
			name: 'inject-page-script',
			hooks: {
				'astro:config:setup': ({ injectScript }) => {
					injectScript('page', `import '/src/scripts/injected.js';`);
				},
			},
		},
	],
});
