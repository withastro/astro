import { viteID } from '../dist/core/util.js';
import type {
	AstroAdapter,
	AstroIntegration,
	HookParameters,
} from '../dist/types/public/integrations.js';

type MiddlewareEntryPoint = HookParameters<'astro:build:ssr'>['middlewareEntryPoint'];

interface TestAdapterOptions {
	provideAddress?: boolean;
	staticHeaders?: boolean;
	extendAdapter?: Partial<AstroAdapter>;
	setMiddlewareEntryPoint?: (middlewareEntryPoint: MiddlewareEntryPoint) => void;
	setManifest?: (manifest: unknown) => void;
	setRouteToHeaders?: (routeToHeaders: Map<string, { headers: Headers }>) => void;
	env?: Record<string, string | undefined>;
}

export default function testAdapter({
	provideAddress = true,
	staticHeaders = false,
	extendAdapter,
	setMiddlewareEntryPoint,
	setManifest,
	setRouteToHeaders,
	env,
}: TestAdapterOptions = {}): AstroIntegration {
	return {
		name: 'my-ssr-adapter',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'test-adapter',
								resolveId: {
									filter: {
										id: /^(astro\/app|@my-ssr)$/,
									},
									handler(id) {
										if (id === '@my-ssr') {
											return id;
										}
										return viteID(new URL('../dist/core/app/index.js', import.meta.url));
									},
								},
								load: {
									filter: {
										id: /^@my-ssr$/,
									},
									handler() {
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
														const filePath = new URL(this.removeBase(url.pathname).replace(/^\\//, ''), this.#manifest.buildClientDir);
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
									},
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
						i18nDomains: 'stable',
					},
					adapterFeatures: {
						buildOutput: 'server',
						staticHeaders: staticHeaders,
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
			'astro:build:generated': ({ routeToHeaders }) => {
				if (setRouteToHeaders) {
					setRouteToHeaders(routeToHeaders);
				}
			},
		},
	};
}

export function selfTestAdapter({
	provideAddress = true,
	staticHeaders = false,
	extendAdapter,
	setMiddlewareEntryPoint,
	setManifest,
	setRouteToHeaders,
	env,
}: TestAdapterOptions = {}): AstroIntegration {
	return {
		name: 'my-ssr-adapter',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'self-test-adapter',
								resolveId: {
									filter: {
										id: /^(astro\/app|@my-ssr)$/,
									},
									handler(id) {
										if (id === '@my-ssr') {
											return id;
										}
										return viteID(new URL('../dist/core/app/index.js', import.meta.url));
									},
								},
								load: {
									filter: {
										id: /^@my-ssr$/,
									},
									handler() {
										return {
											code: `
											import { App, AppPipeline } from 'astro/app';
											import {manifest} from "virtual:astro:manifest"
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
														const filePath = new URL(this.removeBase(url.pathname).replace(/^\\//, ''), this.#manifest.buildClientDir);
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

											function createApp(streaming) {
												return new MyApp(manifest, streaming);
											}

											export { createApp, manifest }
										`,
										};
									},
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
					entrypointResolution: 'auto',
					supportedAstroFeatures: {
						serverOutput: 'stable',
						envGetSecret: 'stable',
						staticOutput: 'stable',
						hybridOutput: 'stable',
						i18nDomains: 'stable',
					},
					adapterFeatures: {
						buildOutput: 'server',
						staticHeaders: staticHeaders,
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
			'astro:build:generated': ({ routeToHeaders }) => {
				if (setRouteToHeaders) {
					setRouteToHeaders(routeToHeaders);
				}
			},
		},
	};
}
