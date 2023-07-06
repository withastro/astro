import { expect } from 'chai';

import {
	createComponent,
	render,
	renderComponent,
	renderSlot,
	maybeRenderHead,
	renderHead,
	Fragment,
} from '../../../dist/runtime/server/index.js';
import { createRenderContext, renderPage } from '../../../dist/core/render/index.js';
import { createBasicEnvironment } from '../test-utils.js';
import * as cheerio from 'cheerio';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

describe('core/render', () => {
	describe('Injected head contents', () => {
		let env;
		before(async () => {
			env = createBasicEnvironment();
		});

		it('Multi-level layouts and head injection, with explicit head', async () => {
			const BaseLayout = createComponent((result, _props, slots) => {
				return render`<html>
					<head>
					${renderSlot(result, slots['head'])}
					${renderHead(result)}
					</head>
					${maybeRenderHead(result)}
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
							${maybeRenderHead(result)}
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
								}
							)}
						`,
					}
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
						default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				links: [{ name: 'link', props: { rel: 'stylesheet', href: '/main.css' }, children: '' }],
				mod: PageModule,
				env,
			});

			const response = await renderPage({
				mod: PageModule,
				renderContext: ctx,
				env,
				params: ctx.params,
				props: ctx.props,
			});

			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('head link')).to.have.a.lengthOf(1);
			expect($('body link')).to.have.a.lengthOf(0);
		});

		it('Multi-level layouts and head injection, without explicit head', async () => {
			const BaseLayout = createComponent((result, _props, slots) => {
				return render`<html>
					${renderSlot(result, slots['head'])}
					${maybeRenderHead(result)}
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
							${maybeRenderHead(result)}
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
								}
							)}
						`,
					}
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
						default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				links: [{ name: 'link', props: { rel: 'stylesheet', href: '/main.css' }, children: '' }],
				env,
				mod: PageModule,
			});

			const response = await renderPage({
				mod: PageModule,
				renderContext: ctx,
				env,
				params: ctx.params,
				props: ctx.props,
			});
			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('head link')).to.have.a.lengthOf(1);
			expect($('body link')).to.have.a.lengthOf(0);
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
					}
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
						default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
					}
				)}`;
			});

			const PageModule = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				links: [{ name: 'link', props: { rel: 'stylesheet', href: '/main.css' }, children: '' }],
				env,
				mod: PageModule,
			});

			const response = await renderPage({
				mod: PageModule,
				renderContext: ctx,
				env,
				params: ctx.params,
				props: ctx.props,
			});
			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('link')).to.have.a.lengthOf(1);
		});
	});
});
