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

	it('Can load markdown pages with Astro', async () => {
		const html = await fixture.readFile('/post/index.html');
		const $ = cheerio.load(html);

		// test 1: There is a div added in markdown
		expect($('#first').length).to.be.ok;

		// test 2: There is a div added via a component from markdown
		expect($('#test').length).to.be.ok;
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

	it.only('Can handle HTML comments in inline code', async () => {
		const html = await fixture.readFile('/comment-with-js/index.html');
		const $ = cheerio.load(html);
		
		expect($('p code').text()).to.equal('<!-- HTML comments in code -->');
	});

	it('Can handle HTML comments in code fences', async () => {
		const html = await fixture.readFile('/comment-with-js/index.html');
		const $ = cheerio.load(html);

		expect($('body > code').text()).to.equal('<!-- HTML comments in code fence -->')
	});

	// https://github.com/withastro/astro/issues/3254
	it('Can handle scripts in markdown pages', async () => {
		const html = await fixture.readFile('/script/index.html');
		expect(html).not.to.match(new RegExp('/src/scripts/test.js'));
	});

	it('Can load more complex jsxy stuff', async () => {
		const html = await fixture.readFile('/complex/index.html');
		const $ = cheerio.load(html);

		expect($('#test').text()).to.equal('Hello world');
	});

	it('Empty code blocks do not fail', async () => {
		const html = await fixture.readFile('/empty-code/index.html');
		const $ = cheerio.load(html);

		// test 1: There is not a `<code>` in the codeblock
		expect($('pre')[0].children).to.have.lengthOf(1);

		// test 2: The empty `<pre>` failed to render
		expect($('pre')[1].children).to.have.lengthOf(0);
	});

	it('Runs code blocks through syntax highlighter', async () => {
		const html = await fixture.readFile('/code/index.html');
		const $ = cheerio.load(html);

		// test 1: There are child spans in code blocks
		expect($('code span').length).greaterThan(0);
	});

	it('Scoped styles should not break syntax highlight', async () => {
		const html = await fixture.readFile('/scopedStyles-code/index.html');
		const $ = cheerio.load(html);

		// test 1: <pre> tag has correct shiki class
		expect($('pre').hasClass('astro-code')).to.equal(true);

		// test 2: inline styles are still applied
		expect($('pre').is('[style]')).to.equal(true);

		// test 3: There are styled child spans in code blocks
		expect($('pre code span').length).to.be.greaterThan(0);
		expect($('pre code span').is('[style]')).to.equal(true);
	});

	function isAstroScopedClass(cls) {
		return /^astro-.*/.test(cls);
	}

	it('Scoped styles should be applied to syntax highlighted lines', async () => {
		const html = await fixture.readFile('/scopedStyles-code/index.html');
		const $ = cheerio.load(html);

		// test 1: the "pre" tag receives scoped style
		const preClassList = $('pre').attr('class').split(/\s+/);
		expect(preClassList.length).to.equal(2);
		const preAstroClass = preClassList.find(isAstroScopedClass);
		expect(Boolean(preAstroClass)).to.equal(true);

		// test 2: each "span" line receives scoped style
		const spanClassList = $('pre code span').attr('class').split(/\s+/);
		expect(spanClassList.length).to.equal(2);
		const spanAstroClass = spanClassList.find(isAstroScopedClass);
		expect(Boolean(spanAstroClass)).to.equal(true);
	});

	it('Renders correctly when deeply nested on a page', async () => {
		const html = await fixture.readFile('/deep/index.html');
		const $ = cheerio.load(html);

		// test 1: Rendered all children
		expect($('#deep').children()).to.have.lengthOf(3);

		// tests 2–4: Only rendered title in each section
		expect($('.a').children()).to.have.lengthOf(1);
		expect($('.b').children()).to.have.lengthOf(1);
		expect($('.c').children()).to.have.lengthOf(1);

		// test 5–7: Rendered title in correct section
		expect($('.a > h2').text()).to.equal('A');
		expect($('.b > h2').text()).to.equal('B');
		expect($('.c > h2').text()).to.equal('C');
	});

	it('Renders dynamic content though the content attribute', async () => {
		const html = await fixture.readFile('/external/index.html');
		const $ = cheerio.load(html);

		// test 1: Rendered markdown content
		expect($('#outer')).to.have.lengthOf(1);

		// test 2: Nested markdown content
		expect($('#inner')).to.have.lengthOf(1);

		// test 3: Scoped class passed down
		expect($('#inner').is('[class]')).to.equal(true);
	});

	it('Renders curly braces correctly', async () => {
		const html = await fixture.readFile('/braces/index.html');
		const $ = cheerio.load(html);

		// test 1: Rendered curly braces markdown content
		expect($('code')).to.have.lengthOf(3);

		// test 2: Rendered curly braces markdown content
		expect($('code:first-child').text()).to.equal('({})');

		// test 3: Rendered curly braces markdown content
		expect($('code:nth-child(2)').text()).to.equal('{...props}');

		// test 4: Rendered curly braces markdown content
		expect($('code:last-child').text()).to.equal('{/* JavaScript */}');
	});

	it('Does not close parent early when using content attribute (#494)', async () => {
		const html = await fixture.readFile('/close/index.html');
		const $ = cheerio.load(html);

		// test <Markdown content /> closed div#target early
		expect($('#target').children()).to.have.lengthOf(2);
	});

	it('Can render markdown with --- for horizontal rule', async () => {
		const html = await fixture.readFile('/dash/index.html');
		expect(!!html).to.equal(true);
	});

	it('Can render markdown content prop (#1259)', async () => {
		const html = await fixture.readFile('/content/index.html');
		const $ = cheerio.load(html);

		// test Markdown rendered correctly via content prop
		expect($('h1').text()).to.equal('Foo');
	});

	it("doesn't occurs TypeError when no elements", async () => {
		const html = await fixture.readFile('/no-elements/index.html');
		// render html without error
		expect(html).to.be.ok;
	});

	it('can render nested list correctly', async () => {
		const html = await fixture.readFile('/nested-list/index.html');
		const $ = cheerio.load(html);
		/**
		 * - list
		 *  - list
		 */
		expect($('#target > ul > li').children()).to.have.lengthOf(1);
		expect($('#target > ul > li > ul > li').text()).to.equal('nested list');
		/**
		 * 1. Hello
		 *  1. nested hello
		 */
		expect($('#target > ol > li').children()).to.have.lengthOf(1);
		expect($('#target > ol > li > ol > li').text()).to.equal('nested hello');
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
		expect($('code').eq(2).text()).to.contain('site: import.meta.env.SITE');
		expect($('blockquote').text()).to.contain('import.meta.env.SITE');

		// test 2: referencing a non-existing var name
		expect($('code').eq(1).text()).to.equal('import.meta.env.TITLE');
		expect($('li').eq(1).text()).to.equal('import.meta.env.TITLE');
		expect($('code').eq(2).text()).to.contain('title: import.meta.env.TITLE');
		expect($('blockquote').text()).to.contain('import.meta.env.TITLE');
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
});
