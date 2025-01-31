import { readFileSync } from 'node:fs';
import type { AstroIntegration, ContainerRenderer } from 'astro';

function getViteConfiguration() {
	return {
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
		ssr: {
			external: ['lit-element', '@lit-labs/ssr', '@astrojs/lit', 'lit/decorators.js'],
		},
	};
}

export function getContainerRenderer(): ContainerRenderer {
	return {
		name: '@astrojs/lit',
		serverEntrypoint: '@astrojs/lit/server.js',
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/lit',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer, injectScript }) => {
				// Inject the necessary polyfills on every page (inlined for speed).
				injectScript(
					'head-inline',
					readFileSync(new URL('../client-shim.min.js', import.meta.url), { encoding: 'utf-8' }),
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
					vite: getViteConfiguration(),
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
