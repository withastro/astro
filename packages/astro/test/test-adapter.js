import { viteID } from '../dist/core/util.js';

/**
 *
 * @returns {import('../src/@types/astro').AstroIntegration}
 */
export default function ({ provideAddress } = { provideAddress: true }) {
	return {
		name: 'my-ssr-adapter',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								resolveId(id) {
									if (id === '@my-ssr') {
										return id;
									} else if (id === 'astro/app') {
										const viteId = viteID(new URL('../dist/core/app/index.js', import.meta.url));
										return viteId;
									}
								},
								load(id) {
									if (id === '@my-ssr') {
										return `
											import { App } from 'astro/app';

											class MyApp extends App {
												render(request, routeData) {
													${provideAddress ? `request[Symbol.for('astro.clientAddress')] = '0.0.0.0';` : ''}
													return super.render(request, routeData);
												}
											}
											
											export function createExports(manifest) {
												return {
													manifest,
													createApp: (streaming) => new MyApp(manifest, streaming)
												};
											}
										`;
									}
								},
							},
						],
					},
				});
			},
			'astro:config:done': ({ setAdapter }) => {
				setAdapter({
					name: 'my-ssr-adapter',
					serverEntrypoint: '@my-ssr',
					exports: ['manifest', 'createApp'],
				});
			},
		},
	};
}
