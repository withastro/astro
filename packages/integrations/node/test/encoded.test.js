import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import node from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('Encoded Pathname', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/encoded/',
			output: 'server',
			adapter: node({
				serverEntrypoint: new URL('./fixtures/encoded/src/server.js', import.meta.url),
			}),
		});
		await fixture.build();
	});

	it('Can get an Astro file', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, text } = createRequestAndResponse({
			url: '/什么',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('什么</h1>'), true);
	});

	it('Can get a Markdown file', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()

		const { req, res, text } = createRequestAndResponse({
			url: '/blog/什么',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('什么</h1>'), true);
	});
});
