import { viteID } from '../dist/core/util.js';

/**
 *
 * @returns {import('../src/@types/astro').AstroIntegration}
 */
export default function (
	{ provideAddress = true, extendAdapter, setEntryPoints = undefined, setRoutes = undefined } = {
		provideAddress: true,
	}
) {
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
											import fs from 'fs';

											class MyApp extends App {
												#manifest = null;
												constructor(manifest, streaming) {
													super(manifest, streaming);
													this.#manifest = manifest;
												}

												async render(request, routeData, locals) {
													const url = new URL(request.url);
													if(this.#manifest.assets.has(url.pathname)) {
														const filePath = new URL('../client/' + this.removeBase(url.pathname), import.meta.url);
														const data = await fs.promises.readFile(filePath);
														return new Response(data);
													}

													${provideAddress ? `request[Symbol.for('astro.clientAddress')] = '0.0.0.0';` : ''}
													return super.render(request, routeData, locals);
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
					...extendAdapter,
				});
			},
			'astro:build:ssr': ({ entryPoints, middlewareEntryPoint }) => {
				if (setEntryPoints) {
					setEntryPoints(entryPoints);
					setEntryPoints(middlewareEntryPoint);
				}
			},
			'astro:build:done': ({ routes }) => {
				if (setRoutes) {
					setRoutes(routes);
				}
			},
		},
	};
}
