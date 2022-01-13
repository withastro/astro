import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Static build - frameworks', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static-build-frameworks/',
			renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react'],
			buildOptions: {
				experimentalStaticBuild: true,
			},
		});
		await fixture.build();
	});

	it('can build preact', async () => {
		const html = await fixture.readFile('/preact/index.html');
		expect(html).to.be.a('string');
	});

	it('can build react', async () => {
		const html = await fixture.readFile('/react/index.html');
		expect(html).to.be.a('string');
	});
});
