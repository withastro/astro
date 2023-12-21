import { loadFixture } from '@astrojs/test-utils';
import { expect } from 'chai';

describe('SSG - Redirects', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		const redirects = await fixture.readFile('./_redirects');
		const parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal([
			'',

			'/two',
			'/',
			'302',

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
