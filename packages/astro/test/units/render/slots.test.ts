import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	addAttribute,
	createComponent,
	Fragment,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import { createBasicPipeline, renderThroughMiddleware } from '../test-utils.ts';

const createAstroModule = (Component: AstroComponentFactory) => ({ default: Component });

/**
 * Helper: render a page component through the pipeline and return the HTML string.
 */
async function renderPage(Page: AstroComponentFactory, pipeline?: Pipeline): Promise<string> {
	const pl = pipeline ?? createBasicPipeline();
	const request = new Request('http://example.com/');
	const routeData = {
		type: 'page',
		pathname: '/index',
		component: 'src/pages/index.astro',
		params: {},
	};
	const state = new FetchState(pl, request);
	state.routeData = routeData as any;
	state.pathname = '/index';
	const response = await renderThroughMiddleware(state, createAstroModule(Page));
	return response.text();
}

// #region Reusable components (mirrors of fixture components)

/**
 * `Slotted.astro` — three named slots (a, b, c) + default, always rendered.
 */
const Slotted = createComponent((result: any, _props: any, slots: any) => {
	return render`<div id="a">
  ${renderSlot(result, slots['a'])}
</div>

<div id="b">
  ${renderSlot(result, slots['b'])}
</div>

<div id="c">
  ${renderSlot(result, slots['c'])}
</div>

<div id="default">
  ${renderSlot(result, slots['default'])}
</div>`;
});

/**
 * `SlottedAPI.astro` — uses Astro.slots.has() to conditionally render wrappers.
 */
const SlottedAPI = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	return render`${
		Astro.slots.has('a') &&
		render`<div id="a">
  ${renderSlot(result, slots['a'])}
</div>`
	}

${
	Astro.slots.has('b') &&
	render`<div id="b">
  ${renderSlot(result, slots['b'])}
</div>`
}

${
	Astro.slots.has('c') &&
	render`<div id="c">
  ${renderSlot(result, slots['c'])}
</div>`
}

${
	Astro.slots.has('default') &&
	render`<div id="default">
  ${renderSlot(result, slots['default'])}
</div>`
}`;
});

/**
 * `Fallback.astro` — default slot with fallback content.
 */
const Fallback = createComponent((result: any, _props: any, slots: any) => {
	return render`${renderSlot(result, slots['default'], render`<div id="default"></div>`)}`;
});

/**
 * `Fallback2.astro` — named slot "override-2" with text fallback.
 */
const Fallback2 = createComponent((result: any, _props: any, slots: any) => {
	return render`<div id="fallback-2">${renderSlot(
		result,
		slots['override-2'],
		render`Fallback should only show when no slot has been provided.`,
	)}</div>`;
});

/**
 * `Render.astro` — imperatively renders default slot via Astro.slots.render().
 */
const Render = createComponent(async (result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { id } = Astro.props;
	const content = await Astro.slots.render('default');
	return render`${maybeRenderHead()}<div${addAttribute(id, 'id')}>${unescapeHTML(content)}</div>`;
});

/**
 * `RenderFn.astro` — identical to Render (renders default slot imperatively).
 */
const RenderFn = createComponent(async (result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { id } = Astro.props;
	const content = await Astro.slots.render('default');
	return render`${maybeRenderHead()}<div${addAttribute(id, 'id')}>${unescapeHTML(content)}</div>`;
});

/**
 * `RenderArgs.astro` — renders default slot passing the `text` prop as argument.
 */
const RenderArgs = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { id, text } = Astro.props;
	return render`${maybeRenderHead()}<div${addAttribute(id, 'id')}>${unescapeHTML(Astro.slots.render('default', [text]))}</div>`;
});

/**
 * `RenderMultipleTimes.astro` — renders default slot `count` times.
 */
const RenderMultipleTimes = createComponent(async (result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { count } = Astro.props;
	const renders: string[] = [];
	for (let i = 0; i < count; i++) {
		renders.push(await Astro.slots.render('default'));
	}
	return render`${renders.map((r, i) => render`${renderComponent(result, 'Fragment', Fragment, { key: i }, { default: () => render`${unescapeHTML(r)}` })}`)}`;
});

/**
 * `Random.astro` — outputs a random number in a div.
 */
const Random = createComponent((_result: any) => {
	const randomNumber = Math.random();
	return render`${maybeRenderHead()}<div>${randomNumber}</div>`;
});

/**
 * `FunctionsToAPI.astro` — renders named slots "before" and "after" with arguments.
 */
const FunctionsToAPI = createComponent(async (result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const content = 'Test Content';
	const beforeContent = await Astro.slots.render('before', [{ content }]);
	const afterContent = await Astro.slots.render('after', [{ content }]);
	return render`${maybeRenderHead()}<div id="before">
  ${beforeContent}
</div>
<div id="after">
  ${afterContent}
</div>`;
});

/**
 * `ConditionalSlottedCallback.astro` — conditionally renders "block" slot with args.
 */
const ConditionalSlottedCallback = createComponent(async (result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	let html = '';
	if (Astro.slots.has('block')) {
		html = await Astro.slots.render('block', [{ test: 'block' }]);
	}
	return render`${renderComponent(result, 'Fragment', Fragment, {}, { default: async () => render`${unescapeHTML(html)}` })}`;
});

/**
 * `Card.astro` — has a named slot "icon" inside a <p>.
 */
const Card = createComponent((result: any, props: any, slots: any) => {
	const { href, title, body } = props;
	return render`${maybeRenderHead()}<li class="link-card">
    <a${addAttribute(href, 'href')}>
        <h2>${title}<span>&rarr;</span></h2>
        <p>${body}${renderSlot(result, slots['icon'])}</p>
    </a>
</li>`;
});

// #endregion

// #region Tests

describe('Slots', () => {
	it('Basic named slots work', async () => {
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Slotted',
					Slotted,
					{},
					{
						a: () => render`<span>A</span>`,
						b: () => render`<span>B</span>`,
						c: () => render`<span>C</span>`,
						default: () => render`<span>Default</span>`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Dynamic named slots work', async () => {
		// Mirrors the compiled output of dynamic.astro: slot names from variables
		const Page = createComponent((result: any) => {
			const slotNames = ['a', 'b', 'c'];
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Slotted',
					Slotted,
					{},
					{
						default: () => render`<span>Default</span>`,
						[slotNames[0]]: () => render`<span>A</span>`,
						[slotNames[1]]: () => render`<span>B</span>`,
						[slotNames[2]]: () => render`<span>C</span>`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Conditional named slots work', async () => {
		// Mirrors the compiled output of conditional.astro
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Slotted',
					Slotted,
					{},
					{
						a: () => render`${true && render`<span>A</span>`}`,
						// biome-ignore lint/correctness/noConstantCondition: mirrors compiled output of conditional.astro
						b: () => render`${true ? render`<span>B</span>` : null}`,
						c: () => render`${() => render`<span>C</span>`}`,
						default: () => render`${true && render`<span>Default</span>`}`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Slots of a component render fallback content by default', async () => {
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(result, 'Fallback', Fallback, {}, {})}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#default').length, 1);
	});

	it('Slots of a page render fallback content', async () => {
		// A page that uses <slot> with fallback — the fallback should display
		const Page = createComponent((result: any, _props: any, slots: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderSlot(result, slots['default'], render`<div id="default"></div>`)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#default').length, 1);
	});

	it('Slots override fallback content', async () => {
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				<div id="fallback">
					${renderComponent(
						result,
						'Fallback',
						Fallback,
						{},
						{
							default: () => render`<div id="override"></div>`,
						},
					)}
					${renderComponent(
						result,
						'Fallback2',
						Fallback2,
						{},
						{
							'override-2': () => render`<div>Slotty slot.</div>`,
						},
					)}
				</div>
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#override').length, 1);
		assert.equal($('#fallback-2').text(), 'Slotty slot.');
	});

	it('Slots work with multiple elements', async () => {
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Slotted',
					Slotted,
					{},
					{
						a: () => render`<span>A</span><span>B</span><span>C</span>`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'ABC');
	});

	it('Slots work on Components', async () => {
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Slotted',
					Slotted,
					{},
					{
						a: () => render`<astro-component>A</astro-component>`,
						default: () => render`<astro-component>Default</astro-component>`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#a').length, 1);
		assert.equal($('#a').children('astro-component').length, 1);
		assert.equal($('#default').children('astro-component').length, 1);
	});

	describe('Slots API work on Components', () => {
		it('IDs will exist whether the slots are filled or not', async () => {
			// Uses Slotted (no has() checks) with no children — all divs render empty
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(result, 'Slotted', Slotted, {}, {})}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);
			assert.equal($('#default').length, 1);
		});

		it('IDs will not exist because the slots are not filled', async () => {
			// Uses SlottedAPI (has() guards) with no children — no divs render
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(result, 'SlottedAPI', SlottedAPI, {}, {})}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);
			assert.equal($('#default').length, 0);
		});

		it('IDs will exist because the slots are filled', async () => {
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'SlottedAPI',
						SlottedAPI,
						{},
						{
							a: () => render`<span>A</span>`,
							b: () => render`<span>B</span>`,
							c: () => render`<span>C</span>`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);
			assert.equal($('#default').length, 0); // default slot is not filled
		});

		it('Default ID will exist because the default slot is filled', async () => {
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'SlottedAPI',
						SlottedAPI,
						{},
						{
							default: () => render`Default`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);
			assert.equal($('#default').length, 1);
		});
	});

	describe('Slots.render() API', () => {
		it('Simple imperative slot render', async () => {
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'Render',
						Render,
						{ id: 'render' },
						{
							default: () => render`render`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#render').length, 1);
			assert.equal($('#render').text(), 'render');
		});

		it('Child function render without args', async () => {
			// Mirrors compiled output: slot content is a function expression
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'RenderFn',
						RenderFn,
						{ id: 'render-fn' },
						{
							default: () => render`${() => 'render-fn'}`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#render-fn').length, 1);
			assert.equal($('#render-fn').text(), 'render-fn');
		});

		it('Child function render with args', async () => {
			// Mirrors compiled output: slot content is a function that receives text
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'RenderArgs',
						RenderArgs,
						{ id: 'render-args', text: 'render-args' },
						{
							default: () => render`${(text: string) => render`<span>${text}</span>`}`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			assert.equal($('#render-args').length, 1);
			assert.equal($('#render-args span').length, 1);
			assert.equal($('#render-args').text(), 'render-args');
		});

		it('Slots rendered multiple times produce independent results', async () => {
			const Page = createComponent((result: any) => {
				return render`<html><head>${renderHead()}</head><body>
					${renderComponent(
						result,
						'RenderMultipleTimes',
						RenderMultipleTimes,
						{ count: 10 },
						{
							default: () => render`${renderComponent(result, 'Random', Random, {}, {})}`,
						},
					)}
				</body></html>`;
			});

			const html = await renderPage(Page);
			const $ = cheerio.load(html);

			const elements = $('div');
			assert.equal(elements.length, 10);

			const first = elements.eq(0);
			const second = elements.eq(1);
			const third = elements.eq(2);

			assert.notEqual(first.text(), second.text());
			assert.notEqual(second.text(), third.text());
			assert.notEqual(third.text(), first.text());
		});
	});

	it('Arguments can be passed to named slots with Astro.slots.render()', async () => {
		// Mirrors compiled output of slotted-named-functions.astro
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'Field',
					FunctionsToAPI,
					{},
					{
						before: () => render`${maybeRenderHead()}<div>
						${({ content }: { content: string }) => render`<div>${content} BEFORE</div>`}
					</div>`,
						after: () => render`<div>
						${({ content }: { content: string }) => render`<div>${content} AFTER</div>`}
					</div>`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		const beforeDiv = $('div#before > div');
		assert.deepEqual(beforeDiv.text(), 'Test Content BEFORE');
		const afterDiv = $('div#after > div');
		assert.deepEqual(afterDiv.text(), 'Test Content AFTER');
	});

	it('Arguments can be passed to conditional named slots with Astro.slots.render()', async () => {
		// Mirrors compiled output of conditional-slotted-callback.astro
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				${renderComponent(
					result,
					'ConditionalSlottedCallback',
					ConditionalSlottedCallback,
					{},
					{
						block: () =>
							render`${
								true &&
								render`${maybeRenderHead()}<fragment>
								${({ test }: { test: string }) => render`<div id="conditional-block">Block: ${test}</div>`}
							</fragment>`
							}`,
					},
				)}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('#conditional-block').text(), 'Block: block');
	});

	it('Unused slot renders without error', async () => {
		// Card has a named "icon" slot that is not filled
		const Page = createComponent((result: any) => {
			return render`<html><head>${renderHead()}</head><body>
				<h1>Test</h1>
				${renderComponent(result, 'Card', Card, { title: 'A card', href: 'http://example.com', body: 'stuff' }, {})}
			</body></html>`;
		});

		const html = await renderPage(Page);
		const $ = cheerio.load(html);

		assert.equal($('body p').children().length, 0);
	});
});
// #endregion
