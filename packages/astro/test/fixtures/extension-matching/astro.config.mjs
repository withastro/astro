import { defineConfig } from 'astro/config';

const MODULE_ID = 'virtual:test';
const RESOLVED_MODULE_ID = '\0virtual:test';

export default defineConfig({
	integrations: [
		{
			name: 'astro-test-invalid-transform',
			hooks: {
				'astro:config:setup': ({ updateConfig }) => {
					updateConfig({
						vite: {
							plugins: [
								// -----------------------------------
								{
									name: 'vite-test-invalid-transform',
									resolveId: {
										filter: {
											id: new RegExp(`^${MODULE_ID}$`),
										},
										handler() {
											// Astro tries to transform this import because the query params can end with '.astro'
											return `${RESOLVED_MODULE_ID}?importer=index.astro`;
										},
									},
									load: {
										filter: {
											id: new RegExp(`^${RESOLVED_MODULE_ID}`),
										},
										handler() {
											return `export default 'true';`;
										},
									},
								},
								// -----------------------------------
							],
						},
					});
				},
			},
		},
	],
});
