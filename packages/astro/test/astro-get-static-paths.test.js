import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths()', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-get-static-paths/',
			buildOptions: {
				site: 'https://mysite.dev/blog/',
				sitemap: false,
			},
		});
		await fixture.build();
	});

	it('is only called once during build', () => {
		// useless expect; if build() throws in setup then this test fails
		expect(true).to.equal(true);
	});
});
