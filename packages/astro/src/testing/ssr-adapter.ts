import { viteID } from '../core/util.js';
import type { AstroAdapter, AstroIntegration } from "../@types/astro";
import type { LoadResult } from "rollup";

/**
 *
 * @returns {import('../src/@types/astro').AstroIntegration}
 */
export default function testSSRAdapter({provideAddress, extendAdapter}: {
	provideAddress: boolean,
	extendAdapter?: Omit<AstroAdapter, "name" | "serverEntrypoint" | "exports">
} = { provideAddress: true }): AstroIntegration {
	return {
		name: 'my-ssr-adapter',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								resolveId(id: string): string | undefined {
									if (id === '@my-ssr') {
										return id;
									} else if (id === 'astro/app') {
										const viteId = viteID(new URL('../dist/core/app/index.js', import.meta.url));
										return viteId;
									}
								},
								/** https://rollupjs.org/plugin-development/#load */
								load(id: string): LoadResult {
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

												async render(request, routeData) {
													const url = new URL(request.url);
													if(this.#manifest.assets.has(url.pathname)) {
														const filePath = new URL('../client/' + this.removeBase(url.pathname), import.meta.url);
														const data = await fs.promises.readFile(filePath);
														return new Response(data);
													}

													${provideAddress ? `request[Symbol.for('astro.clientAddress')] = '0.0.0.0';` : ''}
													return super.render(request, routeData);
												}
											}
											/**
											 * _createExports()_ is called by @astrojs/vite-plugin-astro-ssr in 'packages/astro/src/core/build/plugins/plugin-ssr.ts'.
											 * Which return values of _createExports()_ are exported defines the _setAdapter()_ call in 'astro:config:done'.
											 * The exported values are proceed by _loadTestAdapterApp()_ as returned by _loadFixture()_
											 * in 'packages/astro/src/testing/utils.ts'.
											 * We export _manifest_ explicit because it's private property in MyApp/App class.
											 */
											export function createExports(manifest, args) {
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
			'astro:config:done': ({setAdapter}: { setAdapter: (adapter: AstroAdapter) => void }) => {
				setAdapter({
					name: 'my-ssr-adapter',
					serverEntrypoint: '@my-ssr',
					exports: ['manifest', 'createApp'],
					...extendAdapter,
				});
			},
		},
	};
}
