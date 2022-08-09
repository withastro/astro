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
			const prismFixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					syntaxHighlight: 'prism',
				},
			});
			await prismFixture.build();

			const html = await prismFixture.readFile('/code-in-md/index.html');
			const $ = cheerio.load(html);

			expect($('pre.language-html').length).to.not.equal(0);
		});
	});

	it('Passes frontmatter to layout via "content" and "frontmatter" props', async () => {
		const html = await fixture.readFile('/with-layout/index.html');
		const $ = cheerio.load(html);

		const contentTitle = $('[data-content-title]');
		const frontmatterTitle = $('[data-frontmatter-title]');

		expect(contentTitle.text()).to.equal('With layout');
		expect(frontmatterTitle.text()).to.equal('With layout');
	});

	it('Passes headings to layout via "headings" prop', async () => {
		const html = await fixture.readFile('/with-layout/index.html');
		const $ = cheerio.load(html);

		const headingSlugs = [...$('body').find('[data-headings] > li')].map((el) => $(el).text());

		expect(headingSlugs.length).to.be.greaterThan(0);
		expect(headingSlugs).to.contain('section-1');
		expect(headingSlugs).to.contain('section-2');
	});

	it('Passes compiled content to layout via "compiledContent" prop', async () => {
		const html = await fixture.readFile('/with-layout/index.html');
		const $ = cheerio.load(html);

		const compiledContent = $('[data-compiled-content]');

		expect(fixLineEndings(compiledContent.text()).trim()).to.equal(
			`<h2 id="section-1">Section 1</h2>\n<h2 id="section-2">Section 2</h2>`
		);
	});

	it('Passes raw content to layout via "rawContent" prop', async () => {
		const html = await fixture.readFile('/with-layout/index.html');
		const $ = cheerio.load(html);

		const rawContent = $('[data-raw-content]');

		expect(fixLineEndings(rawContent.text()).trim()).to.equal(
			`## Section 1\n\n## Section 2`
		);
	});

	it('Exposes getHeadings() on glob imports', async () => {
		const { headings } = JSON.parse(await fixture.readFile('/headings-glob.json'));

		const headingSlugs = headings.map((heading) => heading?.slug);

		expect(headingSlugs).to.contain('section-1');
		expect(headingSlugs).to.contain('section-2');
	});

	describe('Vite env vars (#3412)', () => {
		it('Allows referencing import.meta.env in content', async () => {
			const html = await fixture.readFile('/vite-env-vars/index.html');
			const $ = cheerio.load(html);

			// test 1: referencing an existing var name
			expect($('code').eq(0).text()).to.equal('import.meta.env.SITE');
			expect($('li').eq(0).text()).to.equal('import.meta.env.SITE');
			expect($('code').eq(3).text()).to.contain('site: import.meta.env.SITE');

			// // test 2: referencing a non-existing var name
			expect($('code').eq(1).text()).to.equal('import.meta.env.TITLE');
			expect($('li').eq(1).text()).to.equal('import.meta.env.TITLE');
			expect($('code').eq(3).text()).to.contain('title: import.meta.env.TITLE');

			// // test 3: referencing `import.meta.env` itself (without any var name)
			expect($('code').eq(2).text()).to.equal('import.meta.env');
			expect($('li').eq(2).text()).to.equal('import.meta.env');
			expect($('code').eq(3).text()).to.contain('// Use Vite env vars with import.meta.env');
		});
		it('Allows referencing import.meta.env in frontmatter', async () => {
			const { title = '' } = JSON.parse(await fixture.readFile('/vite-env-vars-glob.json'));
			expect(title).to.contain('import.meta.env.SITE');
			expect(title).to.contain('import.meta.env.TITLE');
		});
	});
});
