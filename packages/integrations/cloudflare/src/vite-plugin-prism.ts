import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import components from 'prismjs/components.js';

const MODULE_ID = 'virtual:astro-cloudflare:prism';
const RESOLVED_MODULE_ID = '\0' + MODULE_ID;

const languages = Object.keys(components.languages).filter((l) => l !== 'meta');

export default function cfPrismPlugin(): Plugin {
	return {
		name: '@astrojs/cloudflare:prism',
		configEnvironment(environmentName) {
			if (environmentName === 'ssr') {
				return {
					// Because this virtual module adds a large number of dynamic import statements,
					// Vite’s logs will consequently display the message “new dependencies optimized” for all languages.
					// To avoid this, we explicitly specify that the module should be optimized in advance.
					optimizeDeps: {
						include: ['prismjs/components/prism-*.js'],
					},
				};
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_MODULE_ID}$`),
			},
			async handler() {
				const importerPath = fileURLToPath(import.meta.url);

				const resolvedModules = await Promise.all(
					languages.map(async (lang) => {
						const resolvedId = await this.resolve(
							`prismjs/components/prism-${lang}.js`,
							importerPath,
						);

						return { resolvedId: resolvedId?.id, lang };
					}),
				);
				const prismBundledLanguages = resolvedModules
					.filter(({ resolvedId }) => resolvedId !== undefined)
					.map(
						({ resolvedId, lang }) =>
							`${JSON.stringify(lang)}: () => import(${JSON.stringify(resolvedId)})`,
					);

				return `
					export const bundledLanguages = { ${prismBundledLanguages.join(',')} };
				`;
			},
		},
	};
}
