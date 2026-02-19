import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('<Code>', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-component-code/' });
		await fixture.build();
	});

	it('<Code> without lang or theme', async () => {
		let html = await fixture.readFile('/no-lang/index.html');
		const $ = cheerio.load(html);
		assert.equal($('pre').length, 1);
		// Styles are now class-based - no inline styles
		assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
		assert.ok(!$('pre').attr('style'), 'should have no inline style');
		assert.ok($('pre').attr('class'), 'has classes for styling');
		assert.equal($('pre > code').length, 1);

		// test: contains some generated spans
		assert.equal($('pre > code span').length > 1, true);
	});

	it('<Code lang="...">', async () => {
		let html = await fixture.readFile('/basic/index.html');
		const $ = cheerio.load(html);
		assert.equal($('pre').length, 1);
		// Classes now include token style classes and overflow class
		assert.ok($('pre').hasClass('astro-code'), 'has astro-code class');
		assert.ok($('pre').hasClass('github-dark'), 'has github-dark theme class');
		assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
		assert.equal($('pre > code').length, 1);
		// test: contains many generated spans
		assert.equal($('pre > code span').length >= 6, true);
	});

	it('<Code theme="...">', async () => {
		let html = await fixture.readFile('/custom-theme/index.html');
		const $ = cheerio.load(html);
		assert.equal($('pre').length, 1);
		// Classes now include token style classes and overflow class
		assert.ok($('pre').hasClass('astro-code'), 'has astro-code class');
		assert.ok($('pre').hasClass('nord'), 'has nord theme class');
		assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
		assert.ok(!$('pre').attr('style'), 'should have no inline style');
	});

	it('<Code wrap>', async () => {
		{
			let html = await fixture.readFile('/wrap-true/index.html');
			const $ = cheerio.load(html);
			assert.equal($('pre').length, 1);
			// Wrap styles are now classes, not inline
			assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
			assert.ok($('pre').hasClass('astro-code-wrap'), 'has wrap class');
			assert.ok(!$('pre').attr('style'), 'should have no inline style');
		}
		{
			let html = await fixture.readFile('/wrap-false/index.html');
			const $ = cheerio.load(html);
			assert.equal($('pre').length, 1);
			// Overflow is now a class, not inline
			assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
			assert.ok(!$('pre').hasClass('astro-code-wrap'), 'should NOT have wrap class');
			assert.ok(!$('pre').attr('style'), 'should have no inline style');
		}
		{
			let html = await fixture.readFile('/wrap-null/index.html');
			const $ = cheerio.load(html);
			assert.equal($('pre').length, 1);
			// When wrap is null, no overflow or wrap classes
			assert.ok(!$('pre').hasClass('astro-code-overflow'), 'should not have overflow class');
			assert.ok(!$('pre').hasClass('astro-code-wrap'), 'should not have wrap class');
			assert.ok(!$('pre').attr('style'), 'should have no inline style');
		}
	});

	it('<Code lang="..." theme="css-variables">', async () => {
		let html = await fixture.readFile('/css-theme/index.html');
		const $ = cheerio.load(html);
		assert.equal($('pre').length, 1);
		// Classes now include overflow class
		assert.ok($('pre').hasClass('astro-code'), 'has astro-code class');
		assert.ok($('pre').hasClass('css-variables'), 'has css-variables theme class');
		assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');

		// CSS variables theme still uses inline styles on spans (not transformed by style-to-class)
		// but pre background/color should be in classes, overflow should be a class
		assert.ok(!$('pre').attr('style'), 'pre should have no inline style');

		// Spans should have CSS variable colors as inline styles
		const spans = $('pre span');
		assert.ok(spans.length > 0, 'should have spans');
	});

	it('<Code> with custom theme and lang', async () => {
		let html = await fixture.readFile('/imported/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#theme > pre').length, 1);
		// Styles are now class-based - no inline styles
		assert.ok($('#theme > pre').hasClass('astro-code-overflow'), 'has overflow class');
		assert.ok(!$('#theme > pre').attr('style'), 'should have no inline style');

		assert.equal($('#lang > pre').length, 1);
		assert.equal($('#lang > pre > code span').length, 3);
	});

	it('<Code inline> has no pre tag', async () => {
		let html = await fixture.readFile('/inline/index.html');
		const $ = cheerio.load(html);
		const codeEl = $('.astro-code');

		assert.equal(codeEl.prop('tagName'), 'CODE');
		// Inline code now uses classes instead of inline styles
		assert.ok(codeEl.attr('class'), 'should have classes for styling');
		assert.equal($('pre').length, 0);
	});

	it('<Code embeddedLangs /> tokenizes TSX', async () => {
		const html = await fixture.readFile('/langs/index.html');
		const $ = cheerio.load(html);
		assert.ok([...$('.line > span')].some((el) => $(el).text().trim() === 'const'));
	});
});
