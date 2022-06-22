import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import { viteID } from '../dist/core/util.js';

describe('Integration buildConfig hook', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		let _config;
		fixture = await loadFixture({
			root: './fixtures/ssr-request/',
			experimental: {
				ssr: true,
			},
			adapter: {
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
												return `import { App } from 'astro/app';export function createExports(manifest) { return { manifest, createApp: () => new App(manifest) }; }`;
											}
										},
									},
								],
							},
						});
					},
					'astro:build:start': ({ buildConfig }) => {
						buildConfig.server = new URL('./dist/.root/server/', _config.root);
						buildConfig.client = new URL('./dist/.root/client/', _config.root);
					},
					'astro:config:done': ({ config, setAdapter }) => {
						_config = config;
						setAdapter({
							name: 'my-ssr-adapter',
							serverEntrypoint: '@my-ssr',
							exports: ['manifest', 'createApp'],
						});
					},
				},
			},
		});
		await fixture.build();
	});

	it('Puts client files in the client folder', async () => {
		let data = await fixture.readFile('/.root/client/cars.json');
		expect(data).to.not.be.undefined;
	});

	it('Puts the server entry into the server folder', async () => {
		let data = await fixture.readFile('/.root/server/entry.mjs');
		expect(data).to.not.be.undefined;
	});
});
