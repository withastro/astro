import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown with draft posts disabled', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/astro-markdown-drafts/', import.meta.url),
		});
		await fixture.build();
	});
	it('Does not render the draft post', async () => {
		let renderedDraft = false;
		try {
			await fixture.readFile('/wip/index.html');
			renderedDraft = true;
		} catch (err) {
			expect(err.code).to.equal('ENOENT');
		}
		expect(renderedDraft).to.equal(false, 'Rendered a draft post');
	});
});

describe('Astro Markdown with draft posts enabled', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/astro-markdown-drafts/', import.meta.url),
			markdown: {
				drafts: true,
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
