import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe('SSG - Redirects', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		const redirects = await fixture.readFile('./_redirects');
		const parts = redirects.split(/\s+/);
		// based on https://github.com/withastro/astro/issues/16030 for the default option `trailingSlash: 'ignore'` both variants should be generated
		assert.deepEqual(parts, [
			'',

			'/two/',
			'/',
			'302',

			'/two',
			'/',
			'302',

			'/other/',
			'/',
			'301',

			'/other',
			'/',
			'301',

			'/blog/*',
			'/team/articles/*/index.html',
			'301',

			'',
		]);
	});
});
