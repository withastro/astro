import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import type { Plugin } from 'vite';
import { viteID } from '../dist/core/util.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Integration buildConfig hook', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-request/',
			output: 'server',
			adapter: {
				name: 'my-ssr-adapter',
				hooks: {
					'astro:config:setup': ({ config, updateConfig }) => {
						updateConfig({
							build: {
								server: new URL('./dist/ssr-adapter-build-config/.root/server/', config.root),
								client: new URL('./dist/ssr-adapter-build-config/.root/client/', config.root),
							},
							vite: {
								plugins: [
									{
										name: 'my-ssr-plugin',
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
												return `import { App } from 'astro/app';export function createExports(manifest) { return { manifest, createApp: () => new App(manifest) }; }`;
											},
										},
									} satisfies Plugin,
								],
							},
						});
					},
					'astro:config:done': ({ setAdapter }) => {
						setAdapter({
							name: 'my-ssr-adapter',
							serverEntrypoint: '@my-ssr',
							exports: ['manifest', 'createApp'],
							supportedAstroFeatures: {},
						});
					},
				},
			},
			outDir: './dist/ssr-adapter-build-config/',
			cacheDir: './node_modules/.astro-test/ssr-adapter-build-config/',
		});
		await fixture.build();
	});

	it('Puts client files in the client folder', async () => {
		let data = await fixture.readFile('/.root/client/cars.json');
		assert.notEqual(data, undefined);
	});

	it('Puts the server entry into the server folder', async () => {
		let data = await fixture.readFile('/.root/server/entry.mjs');
		assert.notEqual(data, undefined);
	});
});
