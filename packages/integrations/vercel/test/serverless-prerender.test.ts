import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Serverless prerender', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
		});
		await fixture.build({});
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
	});

	it('outDir is tree-shaken if not needed', async () => {
		const [file] = await fixture.glob(
			'../.vercel/output/functions/_render.func/packages/vercel/test/fixtures/serverless-prerender/.vercel/output/_functions/pages/_image.astro.mjs',
		);
		try {
			await fixture.readFile(file);
			assert.fail();
		} catch {
			assert.ok('Function do be three-shaken');
		}
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('includeFiles work', async () => {
		assert.ok(
			await fixture.readFile(
				'../.vercel/output/functions/render.func/packages/vercel/test/fixtures/serverless-prerender/dist/middleware.mjs',
			),
		);
	});
});

describe('Serverless hybrid rendering', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
			output: 'static',
		});
		await fixture.build({});
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
	});
});
