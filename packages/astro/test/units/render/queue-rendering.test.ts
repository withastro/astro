import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	addAttribute,
	createComponent,
	render,
	renderComponent,
	renderHead,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';

// #region Helpers

function createQueueApp(pages: Array<{ component: AstroComponentFactory; route: string }>) {
	return createTestApp(
		pages.map(({ component, route }) => createPage(component, { route })),
		{ experimentalQueuedRendering: { enabled: true } },
	);
}

// #endregion

// #region Component factories (equivalent to compiled .astro components)

const NestedComponent = createComponent((_result, props) => {
	const level = props.level ?? 0;
	return render`<div class="nested"${addAttribute(level, 'data-level')}><span>Level ${level}</span></div>`;
});

const WithSlotComponent = createComponent(async (result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	const slotContent = await Astro.slots.render('default');
	return render`<div class="with-slot"><h2>${props.title}</h2><div class="slot-content">${unescapeHTML(slotContent)}</div></div>`;
});

const IndexPage = createComponent((result) => {
	const items = ['First', 'Second', 'Third'];
	return render`<html><head><title>Queue Rendering Test</title></head><body>
<h1>Queue Rendering Test</h1>
<section id="simple">
<p>Simple text rendering</p>
<p>Number: ${42}</p>
<p>Boolean: ${true}</p>
</section>
<section id="arrays"><ul>
${items.map((item) => render`<li>${item}</li>`)}
</ul></section>
<section id="nested">
${renderComponent(result, 'Nested', NestedComponent, { level: 0 })}
${renderComponent(result, 'Nested', NestedComponent, { level: 1 })}
${renderComponent(result, 'Nested', NestedComponent, { level: 2 })}
</section>
<section id="slots">
${renderComponent(
	result,
	'WithSlot',
	WithSlotComponent,
	{ title: 'Test Title' },
	{
		default: () => render`<p>Slot content here</p><p>Multiple paragraphs</p>`,
	},
)}
</section>
</body></html>`;
});

const DirectivesPage = createComponent((_result) => {
	const htmlContent = '<strong>Bold text from set:html</strong>';
	const textContent = '<em>This should be escaped</em>';
	return render`<html><head><title>Astro Directives Test</title></head><body>
<h1>Directives Test</h1>
<section id="set-html"><div>${unescapeHTML(htmlContent)}</div></section>
<section id="set-text"><div>${textContent}</div></section>
<section id="class-list"><div${addAttribute(['foo', 'bar', { baz: true, qux: false }], 'class:list')}>Class List Test</div></section>
<section id="inline-style"><div${addAttribute({ color: 'red', fontSize: '20px' }, 'style')}>Styled Text</div></section>
</body></html>`;
});

const HeadContentPage = createComponent((_result) => {
	return render`<html><head><title>Head Content Test</title>${renderHead()}</head><body>
<h1>Head Content Test</h1>
<section id="inline-styles">
<style>.inline-test{color:green}</style>
<p class="inline-test">Inline styles test</p>
</section>
<section id="inline-scripts">
<script>console.log('Inline script executed')</script>
</section>
<section id="component-head">
<div class="with-head"><h3>Component with Head Content</h3><p>This component adds content to the head</p></div>
<style>.with-head{border:1px solid blue}</style>
<script>console.log('WithHead script loaded')</script>
</section>
</body></html>`;
});

// #endregion

// #region Tests

describe('Queue-based rendering', () => {
	describe('Basic rendering', () => {
		const app = createQueueApp([{ component: IndexPage, route: '/' }]);

		it('should render index page successfully', async () => {
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('<title>Queue Rendering Test</title>'));
			assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
		});

		it('should render simple text and primitives correctly', async () => {
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('<p>Simple text rendering</p>'));
			assert.ok(html.includes('<p>Number: 42</p>'));
			assert.ok(html.includes('<p>Boolean: true</p>'));
		});

		it('should render arrays correctly', async () => {
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('<li>First</li>'));
			assert.ok(html.includes('<li>Second</li>'));
			assert.ok(html.includes('<li>Third</li>'));

			const firstPos = html.indexOf('<li>First</li>');
			const secondPos = html.indexOf('<li>Second</li>');
			const thirdPos = html.indexOf('<li>Third</li>');
			assert.ok(firstPos < secondPos);
			assert.ok(secondPos < thirdPos);
		});

		it('should render multiple component instances correctly', async () => {
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('data-level="0"'));
			assert.ok(html.includes('data-level="1"'));
			assert.ok(html.includes('data-level="2"'));
			assert.ok(html.includes('Level 0'));
			assert.ok(html.includes('Level 1'));
			assert.ok(html.includes('Level 2'));
		});

		it('should render components with slots correctly', async () => {
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('class="with-slot"'));
			assert.ok(html.includes('<h2>Test Title</h2>'));
			assert.ok(html.includes('class="slot-content"'));
			assert.ok(html.includes('<p>Slot content here</p>'));
			assert.ok(html.includes('<p>Multiple paragraphs</p>'));
		});
	});

	describe('Astro directives', () => {
		const app = createQueueApp([{ component: DirectivesPage, route: '/directives' }]);

		it('should handle set:html directive', async () => {
			const response = await app.render(new Request('http://example.com/directives'));
			const html = await response.text();
			assert.ok(html.includes('<strong>Bold text from set:html</strong>'));
		});

		it('should handle set:text directive', async () => {
			const response = await app.render(new Request('http://example.com/directives'));
			const html = await response.text();
			assert.ok(html.includes('&lt;em&gt;This should be escaped&lt;/em&gt;'));
		});

		it('should handle class:list directive', async () => {
			const response = await app.render(new Request('http://example.com/directives'));
			const html = await response.text();
			assert.ok(html.includes('class="foo bar baz"'));
		});

		it('should handle inline style objects', async () => {
			const response = await app.render(new Request('http://example.com/directives'));
			const html = await response.text();
			assert.ok(html.includes('color:red') || html.includes('color: red'));
			assert.ok(html.includes('font-size:20px') || html.includes('font-size: 20px'));
		});
	});

	describe('Head content', () => {
		const app = createQueueApp([{ component: HeadContentPage, route: '/head-content' }]);

		it('should include inline styles', async () => {
			const response = await app.render(new Request('http://example.com/head-content'));
			const html = await response.text();
			assert.ok(html.includes('.inline-test'));
			assert.ok(html.includes('color:green') || html.includes('color: green'));
		});

		it('should include component styles', async () => {
			const response = await app.render(new Request('http://example.com/head-content'));
			const html = await response.text();
			assert.ok(html.includes('.with-head'));
		});

		it('should include component scripts', async () => {
			const response = await app.render(new Request('http://example.com/head-content'));
			const html = await response.text();
			assert.ok(html.includes('WithHead script loaded'));
		});

		it('should include inline scripts', async () => {
			const response = await app.render(new Request('http://example.com/head-content'));
			const html = await response.text();
			assert.ok(html.includes('Inline script executed'));
		});
	});

	describe('Configuration', () => {
		it('should support custom pool size configuration', async () => {
			const app = createTestApp([createPage(IndexPage, { route: '/' })], {
				experimentalQueuedRendering: { enabled: true, poolSize: 500 },
			});
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
			assert.ok(html.includes('<p>Simple text rendering</p>'));
		});
	});
});

// #endregion
