import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, fixLineEndings } from './test-utils.js';

describe('Astro Markdown', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-markdown/',
		});
		await fixture.build();
	});

	it('Can parse JSX expressions in markdown pages', async () => {
		const html = await fixture.readFile('/jsx-expressions/index.html');
		const $ = cheerio.load(html);

		expect($('h2').html()).to.equal('Blog Post with JSX expressions');

		expect(html).to.contain('JSX at the start of the line!');
		for (let listItem of ['test-1', 'test-2', 'test-3']) {
			expect($(`#${listItem}`).html()).to.equal(`${listItem}`);
		}
	});

	it('Can handle slugs with JSX expressions in markdown pages', async () => {
		const html = await fixture.readFile('/slug/index.html');
		const $ = cheerio.load(html);

		expect($('h1').attr('id')).to.equal('my-blog-post');
	});

	it('Can handle code elements without extra spacing', async () => {
		const html = await fixture.readFile('/code-element/index.html');
		const $ = cheerio.load(html);

		$('code').each((_, el) => {
			expect($(el).html()).to.equal($(el).html().trim());
		});
	});

	it('Can handle namespaced components in markdown', async () => {
		const html = await fixture.readFile('/namespace/index.html');
		const $ = cheerio.load(html);

		expect($('h1').text()).to.equal('Hello Namespace!');
		expect($('button').length).to.equal(1);
	});

	it('Correctly handles component children in markdown pages (#3319)', async () => {
		const html = await fixture.readFile('/children/index.html');

		expect(html).not.to.contain('<p></p>');
	});

	it('Can handle HTML comments in markdown pages', async () => {
		const html = await fixture.readFile('/comment/index.html');
		const $ = cheerio.load(html);

		expect($('h1').text()).to.equal('It works!');
	});

	it('Prevents `*/` sequences from breaking HTML comments (#3476)', async () => {
		const html = await fixture.readFile('/comment-with-js/index.html');
		const $ = cheerio.load(html);

		expect($('h1').text()).to.equal('It still works!');
	});

	it('Can handle HTML comments in inline code', async () => {
		const html = await fixture.readFile('/comment-with-js/index.html');
		const $ = cheerio.load(html);

		expect($('p code').text()).to.equal('<!-- HTML comments in code -->');
	});

	it('Can handle HTML comments in code fences', async () => {
		const html = await fixture.readFile('/comment-with-js/index.html');
		const $ = cheerio.load(html);

		expect($('pre > code').text()).to.equal('<!-- HTML comments in code fence -->');
	});

	// https://github.com/withastro/astro/issues/3254
	it('Can handle scripts in markdown pages', async () => {
		const html = await fixture.readFile('/script/index.html');
		expect(html).not.to.match(new RegExp('/src/scripts/test.js'));
	});

	it('Empty code blocks do not fail', async () => {
		const html = await fixture.readFile('/empty-code/index.html');
		const $ = cheerio.load(html);

		// test 1: There is not a `<code>` in the codeblock
		expect($('pre')[0].children).to.have.lengthOf(1);

		// test 2: The empty `<pre>` failed to render
		expect($('pre')[1].children).to.have.lengthOf(0);
	});

	it('Can render markdown with --- for horizontal rule', async () => {
		const html = await fixture.readFile('/dash/index.html');
		expect(!!html).to.equal(true);
	});

	it('Exposes raw markdown content', async () => {
		const { raw } = JSON.parse(await fixture.readFile('/raw-content.json'));

		expect(fixLineEndings(raw)).to.equal(
			`\n## With components\n\n### Non-hydrated\n\n<Hello name="Astro Naut" />\n\n### Hydrated\n\n<Counter client:load />\n<SvelteButton client:load />\n`
		);
	});

	it('Exposes HTML parser for raw markdown content', async () => {
		const { compiled } = JSON.parse(await fixture.readFile('/raw-content.json'));

		expect(fixLineEndings(compiled)).to.equal(
			`<h2 id="with-components">With components</h2>\n<h3 id="non-hydrated">Non-hydrated</h3>\n<Hello name="Astro Naut" />\n<h3 id="hydrated">Hydrated</h3>\n<Counter client:load />\n<SvelteButton client:load />`
		);
	});

	it('Allows referencing Vite env var names in markdown (#3412)', async () => {
		const html = await fixture.readFile('/vite-env-vars/index.html');
		const $ = cheerio.load(html);

		// test 1: referencing an existing var name
		expect($('code').eq(0).text()).to.equal('import.meta.env.SITE');
		expect($('li').eq(0).text()).to.equal('import.meta.env.SITE');
		expect($('code').eq(3).text()).to.contain('site: import.meta.env.SITE');
		expect($('blockquote').text()).to.contain('import.meta.env.SITE');

		// test 2: referencing a non-existing var name
		expect($('code').eq(1).text()).to.equal('import.meta.env.TITLE');
		expect($('li').eq(1).text()).to.equal('import.meta.env.TITLE');
		expect($('code').eq(3).text()).to.contain('title: import.meta.env.TITLE');
		expect($('blockquote').text()).to.contain('import.meta.env.TITLE');

		// test 3: referencing `import.meta.env` itself (without any var name)
		expect($('code').eq(2).text()).to.equal('import.meta.env');
		expect($('li').eq(2).text()).to.equal('import.meta.env');
		expect($('code').eq(3).text()).to.contain('// Use Vite env vars with import.meta.env');
		expect($('blockquote').text()).to.match(/import\.meta\.env\s*$/);
	});

	it('Escapes HTML tags in code blocks', async () => {
		const html = await fixture.readFile('/code-in-md/index.html');
		const $ = cheerio.load(html);

		expect($('code').eq(0).html()).to.equal('&lt;script&gt;');
		expect($('blockquote').length).to.equal(1);
		expect($('code').eq(1).html()).to.equal('&lt;/script&gt;');
		expect($('pre').html()).to.contain('&gt;This should also work without any problems.&lt;');
	});

	it('Allows defining slot contents in component children', async () => {
		const html = await fixture.readFile('/slots/index.html');
		const $ = cheerio.load(html);

		const slots = $('article').eq(0);
		expect(slots.find('> .fragmentSlot > div').text()).to.contain('1:');
		expect(slots.find('> .fragmentSlot > div + p').text()).to.contain('2:');
		expect(slots.find('> .pSlot > p[title="hello"]').text()).to.contain('3:');
		expect(slots.find('> .defaultSlot').html()).to.match(
			new RegExp(
				`<div>4: Div in default slot</div>` +
					// Optional extra paragraph due to the line breaks between components
					`(<p></p>)?` +
					`<p>5: Paragraph in fragment in default slot</p>` +
					// Optional whitespace due to the line breaks between components
					`[\s\n]*` +
					`6: Regular text in default slot`
			)
		);

		const nestedSlots = $('article').eq(1);
		expect(nestedSlots.find('> .fragmentSlot').html()).to.contain('1:');
		expect(nestedSlots.find('> .pSlot > p').text()).to.contain('2:');
		expect(nestedSlots.find('> .defaultSlot > article').text().replace(/\s+/g, ' ')).to.equal(
			`
			3: nested fragmentSlot
			4: nested pSlot
			5: nested text in default slot
		`.replace(/\s+/g, ' ')
		);

		expect($('article').eq(3).text().replace(/[^❌]/g, '')).to.equal('❌❌❌');

		expect($('article').eq(4).text().replace(/[^❌]/g, '')).to.equal('❌❌❌');
	});

	it('Generate the right props for the layout', async () => {
		const html = await fixture.readFile('/layout-props/index.html');
		const $ = cheerio.load(html);

		expect($('#title').text()).to.equal('Hello world!');
		expect($('#url').text()).to.equal('/layout-props');
		expect($('#file').text()).to.match(/.*\/layout-props.md$/);
	});
});
