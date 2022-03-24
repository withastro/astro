import { viteID } from '../dist/core/util.js';

/**
 * 
 * @returns {import('../src/@types/astro').AstroIntegration}
 */
export default function() {
	return {
		name: 'my-ssr-adapter',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								resolveId(id) {
									if(id === '@my-ssr') {
										return id;
									} else if(id === 'astro/app') {
										const id = viteID(new URL('../dist/core/app/index.js', import.meta.url));
										return id;
									}
								},
								load(id) {
									if(id === '@my-ssr') {
										return `import { App } from 'astro/app';export function createExports(manifest) { return { manifest, createApp: (root) => new App(manifest, root) }; }`;
									}
								}
							}
						],
					}
				})
			},
			'astro:config:done': ({ setAdapter }) => {
				setAdapter({
					name: 'my-ssr-adapter',
					serverEntrypoint: '@my-ssr',
					exports: ['manifest', 'createApp']
				});
			}
		},
	}
}
