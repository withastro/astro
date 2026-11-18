import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	addAttribute,
	createComponent,
	defineScriptVars,
	defineStyleVars,
	render,
	renderComponent,
	renderHead,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

// #region Component factories (equivalent to compiled .astro output)

// Equivalent to: <h1 style={$$definedVars}>{title}</h1>
// with <style define:vars={{ textColor: 'red' }}>.title { color: var(--textColor); }</style>
const TitleComponent = createComponent((_result, props) => {
	const $$definedVars = defineStyleVars([{ textColor: 'red' }]);
	return render`<h1${addAttribute($$definedVars, 'style')}>${props.title ?? 'Default'}</h1>`;
});

// Mirrors the compiled output of define-vars.astro
const DefineVarsPage = createComponent((result) => {
	const foo = 'bar';
	const bg = 'white';
	const fg = 'black';
	const bar = '<script>bar</script>';
	const undef: undefined = undefined;

	const $$definedVars = defineStyleVars([{ bg }, { fg }]);
	return render`<html${addAttribute($$definedVars, 'style')}>
<head>${renderHead()}</head>
<body>
<script>(function(){${defineScriptVars({ foo })}
console.log(foo);
})();</script>
<script>(function(){${defineScriptVars({ foo })}
console.log(foo);
})();</script>
<script>(function(){${defineScriptVars({ 'dash-case': foo })}
console.log(foo);
})();</script>
<script>(function(){${defineScriptVars({ bar })}
console.log(bar);
})();</script>
<script>(function(){${defineScriptVars({ undef })}
console.log(undef);
})();</script>
<div id="compound-style"${addAttribute([{ color: 'var(--fg)' }, $$definedVars], 'style')}></div>
${renderComponent(result, 'Title', TitleComponent, {})}
</body></html>`;
});

// Mirrors the compiled output of set-html.astro
const SetHtmlPage = createComponent((_result) => {
	return render`<html><head>${renderHead()}</head><body>
<div id="text">${unescapeHTML('a')}</div>
<div id="zero">${unescapeHTML(0)}</div>
<div id="number">${unescapeHTML(1)}</div>
<div id="false">${unescapeHTML(false)}</div>
<div id="true">${unescapeHTML(true)}</div>
<div id="undefined">${unescapeHTML(undefined)}</div>
<div id="null">${unescapeHTML(null)}</div>
</body></html>`;
});

// Mirrors a page with set:html Fragment as slot children
const SetHtmlChildrenPage = createComponent((_result) => {
	return render`<html><body>${unescapeHTML('<p>Test</p>')}</body></html>`;
});

// Mirrors set:html={fetch('/api')} — unescapeHTML handles Promises and Response objects
const SetHtmlFetchPage = createComponent((_result) => {
	const fakeResponse = new Response('<p id="fetched-html">works</p>', {
		headers: { 'Content-Type': 'text/html' },
	});
	return render`<html><body>${unescapeHTML(fakeResponse)}</body></html>`;
});

// #endregion

// #region Tests

describe('Directives', () => {
	it('passes define:vars to script elements', async () => {
		const app = createTestApp([createPage(DefineVarsPage, { route: '/define-vars' })]);
		const response = await app.render(new Request('http://example.com/define-vars'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('script').length, 5);

		let i = 0;
		for (const script of $('script').toArray()) {
			assert.equal($(script).text().startsWith('(function(){'), true);
			assert.equal($(script).text().endsWith('})();'), true);
			if (i < 2) {
				assert.equal($(script).toString().includes('const foo = "bar"'), true);
			} else if (i < 3) {
				assert.equal($(script).toString().includes('const dashCase = "bar"'), true);
			} else if (i < 4) {
				assert.equal(
					$(script).toString().includes('const bar = "\\u003cscript>bar\\u003c/script>"'),
					true,
				);
			} else {
				assert.equal($(script).toString().includes('const undef = undefined'), true);
			}
			i++;
		}
	});

	it('passes define:vars to style elements (via inline style attribute)', async () => {
		const app = createTestApp([createPage(DefineVarsPage, { route: '/define-vars' })]);
		const response = await app.render(new Request('http://example.com/define-vars'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.ok($('html').attr('style')!.includes('--bg: white;'));
		assert.ok($('html').attr('style')!.includes('--fg: black;'));

		// Title component injects --textColor
		assert.ok($('h1').attr('style')!.includes('--textColor: red;'));
	});

	it('properly handles define:vars on style elements with style object', async () => {
		const app = createTestApp([createPage(DefineVarsPage, { route: '/define-vars' })]);
		const response = await app.render(new Request('http://example.com/define-vars'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.ok(
			$('#compound-style').attr('style')!.includes('color:var(--fg);--bg: white;--fg: black;'),
		);
	});

	it('set:html', async () => {
		const app = createTestApp([createPage(SetHtmlPage, { route: '/set-html' })]);
		const response = await app.render(new Request('http://example.com/set-html'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('#text').length, 1);
		assert.equal($('#text').text(), 'a');

		assert.equal($('#zero').length, 1);
		assert.equal($('#zero').text(), '0');

		assert.equal($('#number').length, 1);
		assert.equal($('#number').text(), '1');

		assert.equal($('#undefined').length, 1);
		assert.equal($('#undefined').text(), '');

		assert.equal($('#null').length, 1);
		assert.equal($('#null').text(), '');

		assert.equal($('#false').length, 1);
		assert.equal($('#false').text(), '');

		assert.equal($('#true').length, 1);
		assert.equal($('#true').text(), 'true');
	});

	it('set:html Fragment as slot (children)', async () => {
		const app = createTestApp([createPage(SetHtmlChildrenPage, { route: '/set-html-children' })]);
		const response = await app.render(new Request('http://example.com/set-html-children'));
		const html = await response.text();
		assert.ok(html.includes('Test'));
	});

	it('set:html can take a Response object (fetch result)', async () => {
		const app = createTestApp([createPage(SetHtmlFetchPage, { route: '/set-html-fetch' })]);
		const response = await app.render(new Request('http://example.com/set-html-fetch'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('#fetched-html').length, 1);
		assert.equal($('#fetched-html').text(), 'works');
	});
});

// #endregion
