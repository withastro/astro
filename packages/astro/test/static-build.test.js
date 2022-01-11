import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Static build', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static-build/',
			renderers: [],
			buildOptions: {
				experimentalStaticBuild: true,
			},
		});
		await fixture.build();
	});

	it('Builds out .astro pags', async () => {
		const html = await fixture.readFile('/index.html');
		expect(html).to.be.a('string');
	});

	it('Builds out .md pages', async () => {
		const html = await fixture.readFile('/posts/thoughts/index.html');
		expect(html).to.be.a('string');
	});
});
