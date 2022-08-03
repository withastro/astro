import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, fixLineEndings } from './test-utils.js';

const FIXTURE_ROOT = './fixtures/astro-markdown/';

describe('Astro Markdown', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
		});
		await fixture.build();
	});

	it('Leaves JSX expressions unprocessed', async () => {
		const html = await fixture.readFile('/jsx-expressions/index.html');
		const $ = cheerio.load(html);

		expect($('h2').html()).to.equal('{frontmatter.title}');
	});

	it('Leaves JSX components un-transformed', async () => {
		const html = await fixture.readFile('/components/index.html');

		expect(html).to.include('<counter client:load="" count="{0}">');
	});

	
	it('Exposes raw markdown content', async () => {
		const { raw } = JSON.parse(await fixture.readFile('/raw-content.json'));

		expect(fixLineEndings(raw).trim()).to.equal(
			`# Basic page\n\nLets make sure raw and compiled content look right!`
		);
	});

	it('Exposes compiled HTML content', async () => {
		const { compiled } = JSON.parse(await fixture.readFile('/raw-content.json'));

		expect(fixLineEndings(compiled).trim()).to.equal(
			`<h1 id="basic-page">Basic page</h1>\n<p>Lets make sure raw and compiled content look right!</p>`
		);
	});

	describe('syntax highlighting', async () => {
		it('handles Shiki', async () => {
			const html = await fixture.readFile('/code-in-md/index.html');
			const $ = cheerio.load(html);

			expect($('pre.astro-code').length).to.not.equal(0);
		});

		it('handles Prism', async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					syntaxHighlight: 'prism',
				},
			});
			await fixture.build();

			const html = await fixture.readFile('/code-in-md/index.html');
			const $ = cheerio.load(html);

			expect($('pre.language-html').length).to.not.equal(0);
		});
	});
});
