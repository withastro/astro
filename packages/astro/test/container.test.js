import { describe, it } from 'node:test';
import {
	Fragment,
	createComponent,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	createAstro,
} from '../dist/runtime/server/index.js';
import { unstable_AstroContainer } from '../dist/container/index.js';
import assert from 'node:assert/strict';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

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

describe('Container', () => {
	it('Renders a div with hello world text', async () => {
		const Page = createComponent((result) => {
			return render`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
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

		const container = await unstable_AstroContainer.create();
		const response = await container.renderToString(Page);

		assert.match(response, /hello world/);
	});

	it('Renders a redirect by using the Astro global', async () => {
		const $Astro = createAstro();
		const Page = createComponent(
			(result, props, slots) => {
				const Astro = result.createAstro($Astro, props, slots);
				return Astro.redirect('/something');
			},
			'Component.astro',
			undefined
		);

		const Page2 = createComponent(
			(result) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`${maybeRenderHead(result)}<div>Something!</div>`,
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
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		container.insertRoute({
			path: '/something',
			component: createAstroModule(Page2),
		});
		const response = await container.renderToResponse(Page);

		assert.equal(response.status, 302);
	});

	it('Renders a slot', async () => {
		const Page = createComponent(
			(result, _props, slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead(result)}
							${renderSlot(result, slots['default'])}
							`,
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
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		const result = await container.renderToString(Page, {
			slots: {
				default: 'some slot',
			},
		});

		assert.match(result, /some slot/);
	});

	it('Renders multiple named slots', async () => {
		const Page = createComponent(
			(result, _props, slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead(result)}
							${renderSlot(result, slots['custom-name'])}
							${renderSlot(result, slots['foo-name'])}
							`,
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
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		const result = await container.renderToString(Page, {
			slots: {
				'custom-name': 'Custom name',
				'foo-name': 'Bar name',
			},
		});

		assert.match(result, /Custom name/);
		assert.match(result, /Bar name/);
	});
});
