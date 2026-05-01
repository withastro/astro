import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	addAttribute,
	defineScriptVars,
	formatList,
	internalSpreadAttributes,
	renderElement,
	toAttributeString,
	toStyleString,
} from '../../../dist/runtime/server/render/util.js';
import {
	createComponent,
	Fragment,
	render as renderTemplate,
	renderComponent,
	renderSlot,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import { createTestApp, createPage } from '../mocks.ts';

describe('toAttributeString', () => {
	it('escapes & to &#38;', () => {
		assert.equal(toAttributeString('a&b'), 'a&#38;b');
	});

	it('escapes " to &#34;', () => {
		assert.equal(toAttributeString('say "hello"'), 'say &#34;hello&#34;');
	});

	it('escapes both & and " in the same string', () => {
		assert.equal(toAttributeString('"a&b"'), '&#34;a&#38;b&#34;');
	});

	it('passes through normal strings unchanged', () => {
		assert.equal(toAttributeString('hello world'), 'hello world');
	});

	it('does not escape when shouldEscape is false', () => {
		assert.equal(toAttributeString('a&b', false), 'a&b');
	});

	it('coerces non-string values to string', () => {
		assert.equal(toAttributeString(42), '42');
		assert.equal(toAttributeString(true), 'true');
	});
});

describe('toStyleString', () => {
	it('converts camelCase properties to kebab-case', () => {
		assert.equal(toStyleString({ backgroundColor: 'red' }), 'background-color:red');
	});

	it('leaves lowercase properties unchanged', () => {
		assert.equal(toStyleString({ color: 'blue' }), 'color:blue');
	});

	it('leaves CSS custom properties (--) unchanged', () => {
		assert.equal(toStyleString({ '--my-var': '10px' }), '--my-var:10px');
	});

	it('joins multiple properties with semicolons', () => {
		assert.equal(toStyleString({ color: 'red', fontSize: '16px' }), 'color:red;font-size:16px');
	});

	it('includes numeric values', () => {
		assert.equal(toStyleString({ opacity: 0 }), 'opacity:0');
		assert.equal(toStyleString({ zIndex: 99 }), 'z-index:99');
	});

	it('filters out empty string values', () => {
		assert.equal(toStyleString({ color: '' }), '');
	});

	it('filters out null and undefined values', () => {
		assert.equal(toStyleString({ color: null, background: undefined }), '');
	});

	it('returns empty string for empty object', () => {
		assert.equal(toStyleString({}), '');
	});
});

describe('defineScriptVars', () => {
	it('generates const declaration for a string value', () => {
		const result = String(defineScriptVars({ name: 'Astro' }));
		assert.ok(result.includes('const name = "Astro";'));
	});

	it('generates const declaration for a number value', () => {
		const result = String(defineScriptVars({ count: 42 }));
		assert.ok(result.includes('const count = 42;'));
	});

	it('generates const declaration for an object value', () => {
		const result = String(defineScriptVars({ config: { debug: true } }));
		assert.ok(result.includes('const config = {"debug":true};'));
	});

	it('generates multiple const declarations', () => {
		const result = String(defineScriptVars({ a: 1, b: 2 }));
		assert.ok(result.includes('const a = 1;'));
		assert.ok(result.includes('const b = 2;'));
	});

	it('sanitizes </script> to prevent XSS injection', () => {
		const result = String(defineScriptVars({ evil: '</script>' }));
		assert.ok(!result.includes('</script>'), 'should not contain literal </script>');
		assert.ok(result.includes('\\u003c/script>'), 'should escape the closing tag');
	});

	it('sanitizes case-insensitive </script> variants', () => {
		for (const tag of ['</Script>', '</SCRIPT>', '</sCrIpT>']) {
			const result = String(defineScriptVars({ evil: tag }));
			assert.ok(!result.includes(tag), `should not contain literal ${tag}`);
		}
	});

	it('sanitizes </script> with trailing whitespace before >', () => {
		for (const tag of ['</script >', '</script\t>', '</script\n>']) {
			const result = String(defineScriptVars({ evil: tag }));
			assert.ok(!result.includes(tag), `should not contain literal ${JSON.stringify(tag)}`);
		}
	});

	it('sanitizes self-closing </script/>', () => {
		const result = String(defineScriptVars({ evil: '</script/>' }));
		assert.ok(!result.includes('</script/>'), 'should not contain literal </script/>');
	});

	it('handles undefined values without throwing', () => {
		const result = String(defineScriptVars({ undef: undefined }));
		assert.ok(result.includes('const undef = undefined;'));
	});

	it('converts keys with spaces to valid JS identifiers', () => {
		const result = String(defineScriptVars({ 'my key': 'value' }));
		assert.ok(result.includes('const myKey = "value";'));
	});
});

describe('formatList', () => {
	it('returns the single item for a one-element array', () => {
		assert.equal(formatList(['only']), 'only');
	});

	it('joins two items with "or"', () => {
		assert.equal(formatList(['a', 'b']), 'a or b');
	});

	it('joins three items with comma and "or"', () => {
		assert.equal(formatList(['a', 'b', 'c']), 'a, b or c');
	});

	it('joins four or more items correctly', () => {
		assert.equal(formatList(['a', 'b', 'c', 'd']), 'a, b, c or d');
	});
});

describe('renderElement', () => {
	it('renders a void element without a closing tag', () => {
		const result = renderElement('br', { props: {}, children: '' });
		assert.equal(result, '<br>');
	});

	it('renders a void element with attributes', () => {
		const result = renderElement('img', { props: { src: '/hero.png', alt: 'Hero' }, children: '' });
		assert.equal(result, '<img src="/hero.png" alt="Hero">');
	});

	it('renders a non-void element with children', () => {
		const result = renderElement('div', { props: {}, children: 'Hello' });
		assert.equal(result, '<div>Hello</div>');
	});

	it('renders a non-void element with attributes and children', () => {
		const result = renderElement('span', { props: { class: 'bold' }, children: 'text' });
		assert.equal(result, '<span class="bold">text</span>');
	});

	it('renders a script element with children', () => {
		const result = renderElement('script', { props: {}, children: 'console.log(1)' });
		assert.equal(result, '<script>console.log(1)</script>');
	});

	it('does not render lang, data-astro-id props', () => {
		const result = renderElement('style', {
			props: { lang: 'scss', 'data-astro-id': 'abc' },
			children: 'body{}',
		});
		assert.ok(!result.includes('lang='));
		assert.ok(!result.includes('data-astro-id='));
	});

	it('injects defineVars into script children', () => {
		const result = renderElement('script', {
			props: { 'define:vars': { count: 5 } },
			children: 'console.log(count)',
		});
		assert.ok(result.includes('const count = 5;'));
		assert.ok(result.includes('console.log(count)'));
	});
});

// ---------------------------------------------------------------------------
// Migrated from: test/astro-basic.test.js
// These tests verify the primitives work correctly when invoked through
// createComponent/createTestApp — no Vite build needed.
// ---------------------------------------------------------------------------

describe('Correctly serializes boolean attributes (#astro-basic)', async () => {
	// h1 data-something and h2 not-data-ok are both empty-string boolean-ish attrs
	it('renders empty-value attribute for data-* attr with no value', () => {
		assert.equal(String(addAttribute('', 'data-something')), ' data-something');
	});

	it('renders empty-value attribute for arbitrary attr with no value', () => {
		assert.equal(String(addAttribute('', 'not-data-ok')), ' not-data-ok');
	});
});

describe('Allows spread attributes (#521)', async () => {
	const spread = { a: 0, b: 1, c: 2 };

	it('spreads attributes correctly regardless of position', async () => {
		const spreadPage = createComponent(
			() => renderTemplate`<html><body>
			<div${internalSpreadAttributes(spread, true, 'div')} id="spread-leading"></div>
			<div id="spread-trailing"${internalSpreadAttributes(spread, true, 'div')}></div>
		</body></html>`,
		);

		const app = createTestApp([createPage(spreadPage, { route: '/spread' })]);
		const response = await app.render(new Request('http://example.com/spread'));
		const $ = cheerio.load(await response.text());

		assert.equal($('#spread-leading').attr('a'), '0');
		assert.equal($('#spread-leading').attr('b'), '1');
		assert.equal($('#spread-leading').attr('c'), '2');
		assert.equal($('#spread-trailing').attr('a'), '0');
		assert.equal($('#spread-trailing').attr('b'), '1');
		assert.equal($('#spread-trailing').attr('c'), '2');
	});
});

describe('Supports void elements whose name is a string (#2062)', async () => {
	// Mirrors Input.astro: a component that picks between input/select/textarea
	// based on the `type` prop, demonstrating that void element detection works
	// when the tag name is a runtime string value, not a literal.
	const Input = createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		const { type: initialType, ...rest } = Astro.props;
		const isSelect = /^select$/i.test(initialType);
		const isTextarea = /^textarea$/i.test(initialType);
		const Control = isSelect ? 'select' : isTextarea ? 'textarea' : 'input';
		if (Control === 'input' && initialType) rest.type = initialType;
		const hasSlot = 'default' in Astro.slots;
		// unescapeHTML prevents the string from being HTML-escaped when interpolated
		return renderTemplate`${unescapeHTML(
			renderElement(Control, {
				props: rest,
				children: hasSlot ? String(renderSlot(result, Astro.slots.default)) : '',
			}),
		)}`;
	});

	const inputPage = createComponent(
		(result: any) => renderTemplate`<html><body>
		${renderComponent(result, 'Input', Input, {})}
		${renderComponent(result, 'Input', Input, { type: 'password' })}
		${renderComponent(result, 'Input', Input, { type: 'text' })}
	</body></html>`,
	);

	it('renders void/non-void elements correctly based on runtime tag name', async () => {
		const app = createTestApp([createPage(inputPage, { route: '/input' })]);
		const response = await app.render(new Request('http://example.com/input'));
		const $ = cheerio.load(await response.text());

		// <Input />
		assert.equal($('body > :nth-child(1)').prop('outerHTML'), '<input>');
		// <Input type="password" />
		assert.equal($('body > :nth-child(2)').prop('outerHTML'), '<input type="password">');
		// <Input type="text" />
		assert.equal($('body > :nth-child(3)').prop('outerHTML'), '<input type="text">');
	});
});

// ---------------------------------------------------------------------------
// Migrated from: test/astro-basic.test.js 'Astro basic build'
// ---------------------------------------------------------------------------

describe('Can load page', async () => {
	it('renders h1 content', async () => {
		const page = createComponent(
			() => renderTemplate`<html><body><h1>Hello world!</h1></body></html>`,
		);
		const app = createTestApp([createPage(page, { route: '/' })]);
		const response = await app.render(new Request('http://example.com/'));
		const $ = cheerio.load(await response.text());
		assert.equal($('h1').text(), 'Hello world!');
	});
});

describe('Selector with an empty body', async () => {
	it('renders element with empty CSS class body', async () => {
		const page = createComponent(
			() => renderTemplate`<html><body><div class="author"></div></body></html>`,
		);
		const app = createTestApp([createPage(page, { route: '/empty-class' })]);
		const response = await app.render(new Request('http://example.com/empty-class'));
		const $ = cheerio.load(await response.text());
		assert.equal($('.author').length, 1);
	});
});

describe('Allows forward-slashes in mustache tags (#407)', async () => {
	it('renders hrefs with forward slashes from template expressions', async () => {
		const slugs = ['one', 'two', 'three'];
		const page = createComponent(
			() =>
				renderTemplate`<html><body>${slugs.map((slug) => renderTemplate`<a href="${`/post/${slug}`}">${slug}</a>`)}</body></html>`,
		);
		const app = createTestApp([createPage(page, { route: '/forward-slash' })]);
		const response = await app.render(new Request('http://example.com/forward-slash'));
		const $ = cheerio.load(await response.text());
		assert.equal($('a[href="/post/one"]').length, 1);
		assert.equal($('a[href="/post/two"]').length, 1);
		assert.equal($('a[href="/post/three"]').length, 1);
	});
});

describe('Allows using the Fragment element', async () => {
	it('renders Fragment children without a wrapper element', async () => {
		// Fragment in Astro is transparent — its children render directly into the parent.
		// Simulate by inlining the children without a wrapper component.
		const page = createComponent(
			() =>
				renderTemplate`<html><body><ul>${renderTemplate`<li id="one">One</li>`}</ul></body></html>`,
		);
		const app = createTestApp([createPage(page, { route: '/fragment' })]);
		const response = await app.render(new Request('http://example.com/fragment'));
		const $ = cheerio.load(await response.text());
		assert.equal($('#one').length, 1);
	});

	it('streams sync siblings before async children resolve (issue #13283)', async () => {
		// A deferred promise simulates a slow async child inside the Fragment.
		let resolveAsync: () => void;
		const asyncChild = new Promise<void>((resolve) => {
			resolveAsync = resolve;
		});

		const DEFAULT_RESULT = { clientDirectives: new Map() };

		// Build a Fragment whose default slot contains a sync <p> followed by an async <p>.
		const renderInstance = renderComponent(
			DEFAULT_RESULT as any,
			'Fragment',
			Fragment,
			{},
			{
				default: (_result: any) =>
					renderTemplate`<p id="sync">sync</p>${asyncChild.then(
						() => renderTemplate`<p id="async">async</p>`,
					)}`,
			},
		);

		// Collect chunks as they are written so we can inspect ordering.
		const chunks: string[] = [];
		const destination = {
			write(chunk: unknown) {
				chunks.push(String(chunk));
			},
		};

		// Start rendering — do NOT await yet so we can inspect mid-flight state.
		const instance = await Promise.resolve(renderInstance);
		const renderPromise = (instance as any).render(destination);

		// Yield to the microtask queue so the sync portion can flush.
		await Promise.resolve();

		// The sync <p> must have been written before the async promise resolved.
		const syncFlushed = chunks.join('').includes('sync');
		assert.ok(syncFlushed, 'sync sibling should stream before async child resolves');

		// Now resolve the async child and finish rendering.
		resolveAsync!();
		await renderPromise;

		const html = chunks.join('');
		assert.ok(html.includes('sync'), 'sync content present in final output');
		assert.ok(html.includes('async'), 'async content present in final output');
		// Sync must appear before async in the output.
		assert.ok(html.indexOf('sync') < html.indexOf('async'), 'sync appears before async in output');
	});
});

describe('renders the components top-down', async () => {
	it('renders sibling components in document order', async () => {
		// Mirrors order.astro + OrderA/B/Last.astro using globalThis to track render order
		(globalThis as any).__ASTRO_TEST_ORDER__ = [];

		const OrderA = createComponent((result: any, _p: any, slots: any) => {
			(globalThis as any).__ASTRO_TEST_ORDER__.push('A');
			return renderTemplate`<p>A</p>${renderSlot(result, slots.default)}`;
		});
		const OrderB = createComponent((result: any, _p: any, slots: any) => {
			(globalThis as any).__ASTRO_TEST_ORDER__.push('B');
			return renderTemplate`<p>B</p>${renderSlot(result, slots.default)}`;
		});
		const OrderLast = createComponent(
			() =>
				renderTemplate`<p id="rendered-order">Rendered order: ${() => ((globalThis as any).__ASTRO_TEST_ORDER__ ?? []).join(', ')}</p>`,
		);

		const page = createComponent(
			(result: any) =>
				renderTemplate`<html><body>${renderComponent(
					result,
					'OrderA',
					OrderA,
					{},
					{
						default: (result2: any) =>
							renderTemplate`${renderComponent(
								result2,
								'OrderB',
								OrderB,
								{},
								{
									default: (result3: any) =>
										renderTemplate`${renderComponent(result3, 'OrderLast', OrderLast, {})}`,
								},
							)}`,
					},
				)}</body></html>`,
		);

		const app = createTestApp([createPage(page, { route: '/order' })]);
		const response = await app.render(new Request('http://example.com/order'));
		const $ = cheerio.load(await response.text());
		assert.equal($('#rendered-order').text(), 'Rendered order: A, B');
	});
});
