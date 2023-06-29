import { expect } from 'chai';
import {
	createComponent,
	render,
	renderComponent,
	renderSlot,
} from '../../../dist/runtime/server/index.js';
import { jsx } from '../../../dist/jsx-runtime/index.js';
import {
	createBasicEnvironment,
	createRenderContext,
	renderPage,
	loadRenderer,
} from '../../../dist/core/render/index.js';
import { createAstroJSXComponent, renderer as jsxRenderer } from '../../../dist/jsx/index.js';
import { defaultLogging as logging } from '../../test-utils.js';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });
const loadJSXRenderer = () => loadRenderer(jsxRenderer, { import: (s) => import(s) });

describe('core/render', () => {
	describe('Astro JSX components', () => {
		let env;
		before(async () => {
			env = createBasicEnvironment({
				logging,
				renderers: [await loadJSXRenderer()],
			});
		});

		it('Can render slots', async () => {
			const Wrapper = createComponent((result, _props, slots = {}) => {
				return render`<div>${renderSlot(result, slots['myslot'])}</div>`;
			});

			const Page = createAstroJSXComponent(() => {
				return jsx(Wrapper, {
					children: [
						jsx('p', {
							slot: 'myslot',
							className: 'n',
							children: 'works',
						}),
					],
				});
			});

			const mod = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				env,
				mod,
			});

			const response = await renderPage({
				mod,
				renderContext: ctx,
				env,
			});

			expect(response.status).to.equal(200);

			const html = await response.text();
			expect(html).to.include('<div><p class="n">works</p></div>');
		});

		it('Can render slots with a dash in the name', async () => {
			const Wrapper = createComponent((result, _props, slots = {}) => {
				return render`<div>${renderSlot(result, slots['my-slot'])}</div>`;
			});

			const Page = createAstroJSXComponent(() => {
				return jsx('main', {
					children: [
						jsx(Wrapper, {
							// Children as an array
							children: [
								jsx('p', {
									slot: 'my-slot',
									className: 'n',
									children: 'works',
								}),
							],
						}),
						jsx(Wrapper, {
							// Children as a VNode
							children: jsx('p', {
								slot: 'my-slot',
								className: 'p',
								children: 'works',
							}),
						}),
					],
				});
			});

			const mod = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				env,
				mod,
			});
			const response = await renderPage({
				mod,
				renderContext: ctx,
				env,
			});

			expect(response.status).to.equal(200);

			const html = await response.text();
			expect(html).to.include(
				'<main><div><p class="n">works</p></div><div><p class="p">works</p></div></main>'
			);
		});

		it('Errors in JSX components are raised', async () => {
			const Component = createAstroJSXComponent(() => {
				throw new Error('uh oh');
			});

			const Page = createComponent((result, _props) => {
				return render`<div>${renderComponent(result, 'Component', Component, {})}</div>`;
			});

			const mod = createAstroModule(Page);
			const ctx = await createRenderContext({
				request: new Request('http://example.com/'),
				env,
				mod,
			});

			const response = await renderPage({
				mod,
				renderContext: ctx,
				env,
			});

			try {
				await response.text();
				expect(false).to.equal(true, 'should not have been successful');
			} catch (err) {
				expect(err.message).to.equal('uh oh');
			}
		});
	});
});
