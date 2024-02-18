import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Vercel edge middleware', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let build;
	before(async () => {
		build = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await build.build();
	});

	it('an edge function is created', async () => {
		const contents = await build.readFile(
			'../.vercel/output/functions/_middleware.func/.vc-config.json'
		);
		const contentsJSON = JSON.parse(contents);
		assert.equal(contentsJSON.runtime, 'edge');
		assert.equal(contentsJSON.entrypoint, 'middleware.mjs');
	});

	it('deployment config points to the middleware edge function', async () => {
		const contents = await build.readFile('../.vercel/output/config.json');
		const { routes } = JSON.parse(contents);
		assert.equal(
			routes.some((route) => route.dest === '_middleware'),
			true
		);
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('with edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/integrations/vercel/test/fixtures/middleware-with-edge-file/dist/middleware.mjs'
		);
		// assert.equal(contents.includes('title:')).to.be.true;
		// chaiJestSnapshot.setTestName('Middleware with handler file');
		// assert.equal(contents).to.matchSnapshot(true);
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('without edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-without-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/integrations/vercel/test/fixtures/middleware-without-edge-file/dist/middleware.mjs'
		);
		// assert.equal(contents.includes('title:')).to.be.false;
		// chaiJestSnapshot.setTestName('Middleware without handler file');
		// assert.equal(contents).to.matchSnapshot(true);
	});
});
