import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
	});

	it('outDir is tree-shaken if not needed', async () => {
		const [file] = await fixture.glob(
			'../.vercel/output/functions/_render.func/packages/integrations/vercel/test/fixtures/serverless-prerender/.vercel/output/_functions/chunks/pages/generic_*.mjs'
		);
		const contents = await fixture.readFile(file);
		console.log(contents);
		assert.ok(!contents.includes('const outDir ='), "outDir is tree-shaken if it's not imported");
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('includeFiles work', async () => {
		assert.ok(
			await fixture.readFile(
				'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/serverless-prerender/dist/middleware.mjs'
			)
		);
	});
});

describe('Serverless hybrid rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
			output: 'hybrid',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
	});
});
