import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [
		{
			name: 'injected-css-test',
			hooks: {
				'astro:config:setup': ({ injectScript }) => {
					injectScript('page', `import '/integration/script.js';`);
				},
			},
		},
	],
});
