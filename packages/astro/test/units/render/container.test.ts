import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { experimental_AstroContainer } from '../../../dist/container/index.js';
import {
	createAstro,
	createComponent,
	createHeadAndContent,
	Fragment,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	renderTemplate,
} from '../../../dist/runtime/server/index.js';

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

describe('Container', () => {
	it('Renders a div with hello world text', async () => {
		const Page = createComponent((result) => {
			return render`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
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

		const container = await experimental_AstroContainer.create();
		const response = await container.renderToString(Page);

		assert.match(response, /hello world/);
	});

	it('Renders a rewrite to another page', async () => {
		const $$Astro = createAstro('');
		const Page = createComponent((result, props, slots) => {
			// Test passes `$$Astro` alongside props/slots — the public type only
			// accepts `(props, slots)` but the runtime tolerates the extra arg.
			type ResultCreateAstro = (
				$$Astro: unknown,
				props: Record<string, unknown>,
				slots: Record<string, unknown> | null,
			) => ReturnType<typeof result.createAstro>;
			const resultCreateAstro: ResultCreateAstro =
				result.createAstro as unknown as ResultCreateAstro;
			const Astro = resultCreateAstro($$Astro, props, slots);
			return Astro.rewrite('/example');
		});

		const Example = createComponent((result) => {
			return render`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
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

		const container = await experimental_AstroContainer.create();
		container.insertPageRoute('/example', Example);
		const response = await container.renderToString(Page);

		assert.match(response, /hello world/);
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
							${maybeRenderHead()}
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
							},
						)}
					`,
					},
				)}`;
			},
			'Component2.astro',
			undefined,
		);

		const container = await experimental_AstroContainer.create();
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
							${maybeRenderHead()}
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
							},
						)}
					`,
					},
				)}`;
			},
			'Component2.astro',
			undefined,
		);

		const container = await experimental_AstroContainer.create();
		const result = await container.renderToString(Page, {
			slots: {
				'custom-name': 'Custom name',
				'foo-name': 'Bar name',
			},
		});

		assert.match(result, /Custom name/);
		assert.match(result, /Bar name/);
	});

	it('Renders content and head component', async () => {
		const Page = createComponent(
			(result, _props, slots) => {
				return createHeadAndContent(
					'',
					renderTemplate`${renderComponent(
						result,
						'BaseLayout',
						BaseLayout,
						{},
						{
							default: () => render`
							${maybeRenderHead()}
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
							},
						)}
					`,
						},
					)}`,
				);
			},
			'Component2.astro',
			undefined,
		);

		const container = await experimental_AstroContainer.create();
		const result = await container.renderToString(Page, {
			slots: {
				'custom-name': 'Custom name',
				'foo-name': 'Bar name',
			},
		});

		assert.match(result, /Custom name/);
		assert.match(result, /Bar name/);
	});

	it('Renders props', async () => {
		const Page = createComponent(
			(result, props, _slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead()}
							${props.isOpen ? 'Is open' : 'Is closed'}
							`,
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
			},
			'Component2.astro',
			undefined,
		);

		const container = await experimental_AstroContainer.create();
		const result = await container.renderToString(Page, {
			props: {
				isOpen: true,
			},
		});

		assert.match(result, /Is open/);
	});
});
