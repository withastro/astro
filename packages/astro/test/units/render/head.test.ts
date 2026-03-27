import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createRouteData } from '../mocks.js';
import {
	createComponent,
	Fragment,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
} from '../../../dist/runtime/server/index.js';
import { createBasicPipeline } from '../test-utils.js';

const createAstroModule = (AstroComponent: ReturnType<typeof createComponent>) => ({
	default: AstroComponent,
});

describe('core/render', () => {
	describe('Injected head contents', () => {
		let pipeline: ReturnType<typeof createBasicPipeline>;
		before(async () => {
			pipeline = createBasicPipeline();
			pipeline.headElements = () => ({
				links: new Set([
					{ name: 'link', props: { rel: 'stylesheet', href: '/main.css' }, children: '' },
				]),
				scripts: new Set(),
				styles: new Set(),
			});
		});

		it('Multi-level layouts and head injection, with explicit head', async () => {
			const BaseLayout = createComponent((result, _props, slots) => {
				return render`<html>
					<head>
					${renderSlot(result, slots['head'])}
					${renderHead()}
					</head>
					${maybeRenderHead()}
					<body>
						${renderSlot(result, slots['default'])}
					</body>
				</html>`;
			});

			const PageLayout = createComponent((result, _props, slots) => {
				return render`${renderComponent(
					result,
					'Layout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead()}
							<main>
								${renderSlot(result, slots['default'])}
							</main>
						`,
						head: () => render`
							${renderComponent(
								result,
								'Fragment',
								Fragment,
								{ slot: 'head' },
								{
									default: () => render`${renderSlot(result, slots['head'])}`,
								},
							)}
						`,
					},
				)}
				`;
			});

			const Page = createComponent((result) => {
				return render`${renderComponent(
					result,
					'PageLayout',
					PageLayout,
					{},
					{
						default: () => render`${maybeRenderHead()}<div>hello world</div>`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							},
						)}
					`,
					},
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const request = new Request('http://example.com/');
			const routeData = createRouteData({
				route: '/',
				pathname: '/index',
				component: 'src/pages/index.astro',
			});
			const renderContext = await RenderContext.create({
				pipeline,
				request,
				routeData,
				pathname: '/',
				clientAddress: '127.0.0.1',
			});
			const response = await renderContext.render(PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('head link').length, 1);
			assert.equal($('body link').length, 0);
		});

		it('Multi-level layouts and head injection, without explicit head', async () => {
			const BaseLayout = createComponent((result, _props, slots) => {
				return render`<html>
					${renderSlot(result, slots['head'])}
					${maybeRenderHead()}
					<body>
						${renderSlot(result, slots['default'])}
					</body>
				</html>`;
			});

			const PageLayout = createComponent((result, _props, slots) => {
				return render`${renderComponent(
					result,
					'Layout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead()}
							<main>
								${renderSlot(result, slots['default'])}
							</main>
						`,
						head: () => render`
							${renderComponent(
								result,
								'Fragment',
								Fragment,
								{ slot: 'head' },
								{
									default: () => render`${renderSlot(result, slots['head'])}`,
								},
							)}
						`,
					},
				)}
				`;
			});

			const Page = createComponent((result) => {
				return render`${renderComponent(
					result,
					'PageLayout',
					PageLayout,
					{},
					{
						default: () => render`${maybeRenderHead()}<div>hello world</div>`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							},
						)}
					`,
					},
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const request = new Request('http://example.com/');
			const routeData = createRouteData({
				route: '/',
				pathname: '/index',
				component: 'src/pages/index.astro',
			});
			const renderContext = await RenderContext.create({
				pipeline,
				request,
				routeData,
				pathname: '/',
				clientAddress: '127.0.0.1',
			});
			const response = await renderContext.render(PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('head link').length, 1);
			assert.equal($('body link').length, 0);
		});

		it('Multi-level layouts and head injection, without any content in layouts', async () => {
			const BaseLayout = createComponent((result, _props, slots) => {
				return render`${renderSlot(result, slots['default'])}`;
			});

			const PageLayout = createComponent((result, _props, slots) => {
				return render`${renderComponent(
					result,
					'Layout',
					BaseLayout,
					{},
					{
						default: () => render`${renderSlot(result, slots['default'])}	`,
					},
				)}
				`;
			});

			const Page = createComponent((result) => {
				return render`${renderComponent(
					result,
					'PageLayout',
					PageLayout,
					{},
					{
						default: () => render`${maybeRenderHead()}<div>hello world</div>`,
					},
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const request = new Request('http://example.com/');
			const routeData = createRouteData({
				route: '/',
				pathname: '/index',
				component: 'src/pages/index.astro',
			});
			const renderContext = await RenderContext.create({
				pipeline,
				request,
				routeData,
				pathname: '/',
				clientAddress: '127.0.0.1',
			});
			const response = await renderContext.render(PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('link').length, 1);
		});
	});
});
