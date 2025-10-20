import { viteID } from '../dist/core/util.js';

/**
 * @typedef {import('../src/types/public/integrations.js').AstroAdapter} AstroAdapter
 * @typedef {import('../src/types/public/integrations.js').AstroIntegration} AstroIntegration
 * @typedef {import('../src/types/public/integrations.js').HookParameters<"astro:build:ssr">['middlewareEntryPoint']} MiddlewareEntryPoint
 * @typedef {import('../src/types/public/integrations.js').HookParameters<"astro:build:done">['routes']} Routes
 */

/**
 *
 * @param {{
 * 	provideAddress?: boolean;
 * 	extendAdapter?: AstroAdapter;
 * 	setMiddlewareEntryPoint?: (middlewareEntryPoint: MiddlewareEntryPoint) => void;
 * 	env: Record<string, string | undefined>;
 * }} param0
 * @returns {AstroIntegration}
 */
export default function ({
	provideAddress = true,
	staticHeaders = false,
	extendAdapter,
	setMiddlewareEntryPoint,
	setManifest,
	setRouteToHeaders,
	env,
} = {}) {
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
										return {
											code: `
											import { App, AppPipeline } from 'astro/app';
											import fs from 'fs';

											${
												env
													? `
											await import('astro/env/setup')
												.then(mod => mod.setGetEnv((key) => {
													const data = ${JSON.stringify(env)};
													return data[key];
												}))
												.catch(() => {});`
													: ''
											}

											class MyApp extends App {
												#manifest = null;
												constructor(manifest, streaming) {
													super(manifest, streaming);
													this.#manifest = manifest;
												}
												
												createPipeline(streaming) {
													return AppPipeline.create({
														manifest: this.manifest,
														logger: this.logger,
														streaming
													})
												}

												async render(request, { routeData, clientAddress, locals, addCookieHeader, prerenderedErrorPageFetch } = {}) {
													const url = new URL(request.url);
													if(this.#manifest.assets.has(url.pathname)) {
														const filePath = new URL('../../client/' + this.removeBase(url.pathname), import.meta.url);
														const data = await fs.promises.readFile(filePath);
														return new Response(data);
													}

													return super.render(request, {
														routeData,
														locals,
														addCookieHeader,
														prerenderedErrorPageFetch,
													${provideAddress ? `clientAddress: clientAddress ?? '0.0.0.0',` : ''}
													});
												}
											}

											export function createExports(manifest) {
												return {
													manifest,
													createApp: (streaming) => new MyApp(manifest, streaming)
												};
											}
										`,
										};
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
					supportedAstroFeatures: {
						serverOutput: 'stable',
						envGetSecret: 'stable',
						staticOutput: 'stable',
						hybridOutput: 'stable',
						assets: 'stable',
						i18nDomains: 'stable',
					},
					adapterFeatures: {
						buildOutput: 'server',
						experimentalStaticHeaders: staticHeaders,
					},
					...extendAdapter,
				});
			},
			'astro:build:ssr': ({ middlewareEntryPoint, manifest }) => {
				if (setMiddlewareEntryPoint) {
					setMiddlewareEntryPoint(middlewareEntryPoint);
				}
				if (setManifest) {
					setManifest(manifest);
				}
			},
			'astro:build:generated': ({ experimentalRouteToHeaders }) => {
				if (setRouteToHeaders) {
					setRouteToHeaders(experimentalRouteToHeaders);
				}
			},
		},
	};
}
