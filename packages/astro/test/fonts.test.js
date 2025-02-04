// @ts-check
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import assert from 'node:assert/strict';

describe('astro:fonts', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/fonts/',
			// experimental: {
			// 	fonts: {
			// 		families: [
			// 			{
			// 				name: 'Roboto',
			// 				provider: 'google',
			// 			},
			// 		],
			// 	},
			// },
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('<Fonts /> component', () => {
		// TODO: remove once fonts are stabilized
		it('Throws an error if fonts are not enabled', async () => {
			const res = await fixture.fetch('/');
			const body = await res.text();
			assert.equal(
				body.includes('<script type="module" src="/@vite/client">'),
				true,
				'Body does not include Vite error overlay script',
			);
		});
	});
});
