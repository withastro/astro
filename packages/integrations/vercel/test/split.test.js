import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('build: split', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/functionPerRoute/',
			output: 'server',
		});
		await fixture.build();
	});

	it('creates separate functions for non-prerendered pages', async () => {
		const files = await fixture.readdir('../.vercel/output/functions/');
		assert.equal(files.length, 3);
		assert.equal(files.includes('prerender.astro.func'), false);
	});

	it('creates the route definitions in the config.json', async () => {
		const json = await fixture.readFile('../.vercel/output/config.json');
		const config = JSON.parse(json);
		assert.equal(config.routes.length, 5);
		assert.equal(
			config.routes.some((route) => route.dest === 'prerender.astro'),
			false
		);
	});
});
