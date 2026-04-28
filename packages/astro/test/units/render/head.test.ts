import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	createComponent,
	Fragment,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
} from '../../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../../dist/runtime/server/render/index.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import { createBasicPipeline, renderThroughMiddleware } from '../test-utils.ts';

const createAstroModule = (AstroComponent: AstroComponentFactory) => ({ default: AstroComponent });

describe('core/render', () => {
	describe('Injected head contents', () => {
		let pipeline: Pipeline;
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
			const BaseLayout = createComponent((result: any, _props: any, slots: any) => {
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

			const PageLayout = createComponent((result: any, _props: any, slots: any) => {
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

			const Page = createComponent((result: any) => {
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
			const routeData = {
				type: 'page',
				pathname: '/index',
				component: 'src/pages/index.astro',
				params: {},
			};
			const state = new FetchState(pipeline, request);
			state.routeData = routeData as any;
			state.pathname = '/index';
			const response = await renderThroughMiddleware(state, PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('head link').length, 1);
			assert.equal($('body link').length, 0);
		});

		it('Multi-level layouts and head injection, without explicit head', async () => {
			const BaseLayout = createComponent((result: any, _props: any, slots: any) => {
				return render`<html>
					${renderSlot(result, slots['head'])}
					${maybeRenderHead()}
					<body>
						${renderSlot(result, slots['default'])}
					</body>
				</html>`;
			});

			const PageLayout = createComponent((result: any, _props: any, slots: any) => {
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

			const Page = createComponent((result: any) => {
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
			const routeData = {
				type: 'page',
				pathname: '/index',
				component: 'src/pages/index.astro',
				params: {},
			};
			const state = new FetchState(pipeline, request);
			state.routeData = routeData as any;
			state.pathname = '/index';
			const response = await renderThroughMiddleware(state, PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('head link').length, 1);
			assert.equal($('body link').length, 0);
		});

		it('Multi-level layouts and head injection, without any content in layouts', async () => {
			const BaseLayout = createComponent((result: any, _props: any, slots: any) => {
				return render`${renderSlot(result, slots['default'])}`;
			});

			const PageLayout = createComponent((result: any, _props: any, slots: any) => {
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

			const Page = createComponent((result: any) => {
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
			const routeData = {
				type: 'page',
				pathname: '/index',
				component: 'src/pages/index.astro',
				params: {},
			};
			const state = new FetchState(pipeline, request);
			state.routeData = routeData as any;
			state.pathname = '/index';
			const response = await renderThroughMiddleware(state, PageModule);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('link').length, 1);
		});
	});
});
