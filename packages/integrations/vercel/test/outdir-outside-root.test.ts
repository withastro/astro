import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('outDir outside root', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/outdir-outside-root/app/',
		});
		await fixture.build({});
	});

	it('build successful', { timeout: 30000 }, async () => {
		// .vercel/output is created relative to root (app/), readFile resolves
		// relative to outDir (dist/), so we go up to the fixture dir and into app.
		assert.ok(await fixture.readFile('../app/.vercel/output/config.json'));
	});

	it('function includes traced chunks, not just entry', { timeout: 30000 }, async () => {
		const files = await fixture.glob('../app/.vercel/output/functions/_render.func/**/*.mjs');
		// The function should contain the entry plus at least one chunk.
		// If NFT tracing fails (the bug), only the entry is included.
		assert.ok(
			files.length > 1,
			`Expected more than 1 .mjs file in the function, got ${files.length}`,
		);
	});
});
