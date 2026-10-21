import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Building with concurrency > 1', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/build-concurrency/',
			build: {
				concurrency: 2,
			},
			outDir: './dist/build-concurrency/',
		});
	});

	it('Errors and exits', async () => {
		let built = false;
		try {
			await fixture.build();
			built = true;
		} catch (err) {
			assert.match((err as Error).message, /This is a test/);
		}

		assert.equal(built, false, 'Build should not complete');
	});
});

describe('Building i18n fallbacks with concurrency > 1', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/build-concurrency-i18n-fallback/',
			build: {
				concurrency: 4,
			},
			outDir: './dist/build-concurrency-i18n-fallback/',
		});
	});

	it('builds rewrite fallbacks after their source pages', async () => {
		await fixture.build();

		assert.match(await fixture.readFile('/es/articles/slow-page/index.html'), /Article: slow-page/);
	});
});
