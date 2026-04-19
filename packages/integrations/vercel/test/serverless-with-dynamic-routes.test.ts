import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Serverless with dynamic routes', () => {
	let fixture: Fixture;

	before(async () => {
		process.env.PRERENDER = 'true';
		fixture = await loadFixture({
			root: './fixtures/serverless-with-dynamic-routes/',
			output: 'server',
		});
		await fixture.build({});
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
		assert.ok(await fixture.readFile('../.vercel/output/functions/_render.func/.vc-config.json'));
	});
});
