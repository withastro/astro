import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

describe('Static build - frameworks', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static-build-frameworks/',
			renderers: ['@astrojs/renderer-preact'],
			buildOptions: {
				experimentalStaticBuild: true,
			},
		});
		await fixture.build();
	});

	it('can build preact', async () => {
		const html = await fixture.readFile('/index.html');
		expect(html).to.be.a('string');
	});
});
