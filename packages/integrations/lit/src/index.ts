import { readFileSync } from 'node:fs';
import type { AstroIntegration, ViteUserConfig } from 'astro';

function getViteConfiguration(independent: boolean): ViteUserConfig {
	const config: ViteUserConfig = {
		optimizeDeps: {
			include: [
				'@astrojs/lit/dist/client.js',
				'@astrojs/lit/client-shim.js',
				'@astrojs/lit/hydration-support.js',
				'@webcomponents/template-shadowroot/template-shadowroot.js',
				'@lit-labs/ssr-client/lit-element-hydrate-support.js',
			],
			exclude: ['@astrojs/lit/server.js'],
		},
	};

	if (independent) {
		return {
			...config,
			ssr: {
				external: ['lit-element', '@astrojs/lit', 'lit/decorators.js'],
			},
			build: {
				rollupOptions: {
					output: {
						manualChunks: (id) => {
							if (id.includes('@lit-labs/ssr')) {
								return `_vendor.lit-ssr`;
							}
						},
					},
				},
			},
		};
	}

	return {
		...config,
		ssr: {
			external: ['lit-element', '@lit-labs/ssr', '@astrojs/lit', 'lit/decorators.js'],
		},
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/lit',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer, injectScript, config }) => {
				// Inject the necessary polyfills on every page (inlined for speed).
				injectScript(
					'head-inline',
					readFileSync(new URL('../client-shim.min.js', import.meta.url), { encoding: 'utf-8' })
				);
				// Inject the hydration code, before a component is hydrated.
				injectScript('before-hydration', `import '@astrojs/lit/hydration-support.js';`);
				// Add the lit renderer so that Astro can understand lit components.
				addRenderer({
					name: '@astrojs/lit',
					serverEntrypoint: '@astrojs/lit/server.js',
					clientEntrypoint: '@astrojs/lit/dist/client.js',
				});
				// Update the vite configuration.
				updateConfig({
					vite: getViteConfiguration(config.experimental.isIndependent),
				});
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					if (!vite.ssr) {
						vite.ssr = {};
					}
					if (!vite.ssr.noExternal) {
						vite.ssr.noExternal = [];
					}
					if (Array.isArray(vite.ssr.noExternal)) {
						vite.ssr.noExternal.push('lit');
					}
				}
			},
		},
	};
}
