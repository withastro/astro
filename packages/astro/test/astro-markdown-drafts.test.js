import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown with draft posts disabled', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-markdown-drafts/',
			buildOptions: {
				// drafts is false by default but added here for clarity
				drafts: false,
				sitemap: false,
			},
		});
		await fixture.build();
	});
	it('Does not render the draft post', async () => {
		try {
			await fixture.readFile('/wip/index.html');
		} catch (err) {
			expect(err.code).to.equal('ENOENT');
		}
	});
});

describe('Astro Markdown with draft posts enabled', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-markdown-drafts/',
			buildOptions: {
				drafts: true,
				sitemap: false,
			},
		});
		await fixture.build();
	});
	it('Renders the draft post', async () => {
		const html = await fixture.readFile('/wip/index.html');
		const $ = cheerio.load(html);
		expect($('h1').length).to.be.ok;
		expect($('h1').text()).to.equal('WIP');
	});
});
