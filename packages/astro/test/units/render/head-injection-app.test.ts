import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { RenderContext } from '../../../dist/core/render-context.js';
import {
	createComponent,
	createHeadAndContent,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	renderSlotToString,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import { createBasicPipeline } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory) => ({ default: AstroComponent });

describe('head injection app-level rendering', () => {
	let pipeline: Pipeline;

	before(async () => {
		pipeline = createBasicPipeline();
		pipeline.headElements = () => ({
			links: new Set(),
			scripts: new Set(),
			styles: new Set(),
		});
	});

	async function renderPage(Component: AstroComponentFactory) {
		const request = new Request('http://example.com/');
		const routeData = {
			type: 'page',
			pathname: '/index',
			component: 'src/pages/index.astro',
			params: {},
		};
		const renderContext = await RenderContext.create({ pipeline, request, routeData } as any);
		const response = await renderContext.render(createAstroModule(Component));
		return cheerio.load(await response.text());
	}

	it('injects propagated head from component created in page scope', async () => {
		const Other = createComponent(() => render`<div id="other">Other</div>`);
		const HeadEntry = createComponent({
			factory(result: any, props: any, slots: any) {
				const link = renderUniqueStylesheet(result, {
					type: 'external',
					src: '/some/fake/styles.css',
				});
				return createHeadAndContent(
					unescapeHTML(link) as unknown as string,
					render`${renderComponent(result, 'Other', Other, props, slots)}`,
				);
			},
			propagation: 'self',
		});

		const Wrapper = createComponent(
			(result: any) =>
				render`<html><head>${renderHead()}</head><body>${renderComponent(result, 'HeadEntry', HeadEntry, {}, {})}</body></html>`,
		);

		const $ = await renderPage(Wrapper);
		assert.equal($('head link[rel="stylesheet"][href="/some/fake/styles.css"]').length, 1);
		assert.equal($('body link[rel="stylesheet"]').length, 0);
		assert.equal($('#other').length, 1);
	});

	it('injects propagated head through nested layout components', async () => {
		const Other = createComponent(() => render`<div id="other">Other</div>`);
		const HeadEntry = createComponent({
			factory(result: any, props: any, slots: any) {
				const link = renderUniqueStylesheet(result, {
					type: 'external',
					src: '/some/fake/styles.css',
				});
				return createHeadAndContent(
					unescapeHTML(link) as unknown as string,
					render`${renderComponent(result, 'Other', Other, props, slots)}`,
				);
			},
			propagation: 'self',
		});

		const Content = createComponent(
			(result: any) => render`${renderComponent(result, 'HeadEntry', HeadEntry, {}, {})}`,
		);
		Content.propagation = 'in-tree';
		const Inner = createComponent(
			(result: any) => render`${renderComponent(result, 'Content', Content, {}, {})}`,
		);
		Inner.propagation = 'in-tree';
		const Layout = createComponent({
			async factory(result: any, _props: any, slots: any) {
				const slotted = await renderSlotToString(result, slots.default);
				return render`<html><head><title>Normal head stuff</title>${renderHead()}</head><body>${unescapeHTML(slotted)}</body></html>`;
			},
		});
		const Page = createComponent(
			(result: any) =>
				render`${renderComponent(result, 'Layout', Layout, {}, { default: () => render`${renderComponent(result, 'Inner', Inner, {}, {})}` })}`,
		);

		const $ = await renderPage(Page);
		assert.equal($('head link[rel="stylesheet"][href="/some/fake/styles.css"]').length, 1);
		assert.equal($('body link[rel="stylesheet"]').length, 0);
		assert.equal($('#other').length, 1);
	});

	it('supports slot rendering during head buffering without style bleed', async () => {
		const SlottedContent = createComponent({
			factory(result: any) {
				const link = renderUniqueStylesheet(result, {
					type: 'external',
					src: '/styles/from-slot.css',
				});
				return createHeadAndContent(
					unescapeHTML(link) as unknown as string,
					render`<p>Paragraph.</p>`,
				);
			},
			propagation: 'self',
		});

		const SlotRenderComponent = createComponent({
			async factory(result: any, _props: any, slots: any) {
				const html = await renderSlotToString(result, slots.default);
				const ownLink = renderUniqueStylesheet(result, {
					type: 'external',
					src: '/styles/slot-render.css',
				});
				return createHeadAndContent(
					ownLink!,
					render`<div class="p-sample">${unescapeHTML(html)}</div>`,
				);
			},
			propagation: 'self',
		});

		const Layout = createComponent(
			(result: any, _props: any, slots: any) =>
				render`<html><head></head>${maybeRenderHead()}<body>${renderSlot(result, slots.default)}</body></html>`,
		);
		const Page = createComponent(
			(result: any) =>
				render`${renderComponent(
					result,
					'Layout',
					Layout,
					{},
					{
						default: () =>
							render`${renderComponent(
								result,
								'SlotRenderComponent',
								SlotRenderComponent,
								{},
								{
									default: () =>
										render`${renderComponent(result, 'SlottedContent', SlottedContent, {}, {})}`,
								},
							)}`,
					},
				)}`,
		);

		const $ = await renderPage(Page);
		assert.equal($('head link[href="/styles/slot-render.css"]').length, 1);
		assert.equal($('head link[href="/styles/from-slot.css"]').length, 1);
		assert.equal($('body link[rel="stylesheet"]').length, 0);
		assert.equal($('p').text(), 'Paragraph.');
	});
});
