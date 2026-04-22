import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { experimental_AstroContainer } from '../dist/container/index.js';
import {
	createComponent,
	createHeadAndContent,
	Fragment,
	render,
	renderComponent,
	renderSlot,
	renderTemplate,
} from '../dist/runtime/server/index.js';
import * as server from '../dist/runtime/server/index.js';
import testAdapter from './test-adapter.js';
import { type App, type Fixture, loadFixture } from './test-utils.js';

// The public type signatures of `renderHead`/`maybeRenderHead`/`createAstro` hide
// the extra args that the runtime internally tolerates. Re-type them here so
// the test body can exercise the internal surface without scattering
// `@ts-expect-error` comments.
type RenderHead = (result: unknown) => ReturnType<typeof server.renderHead>;
type MaybeRenderHead = (result: unknown) => ReturnType<typeof server.maybeRenderHead>;
type CreateAstro = (...args: unknown[]) => ReturnType<typeof server.createAstro>;

const renderHead: RenderHead = server.renderHead;
const maybeRenderHead: MaybeRenderHead = server.maybeRenderHead;
const createAstro = server.createAstro as unknown as CreateAstro;

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

	it('Renders a div with hello world text', async () => {
		const $$Astro = createAstro();
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
					default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
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
							${maybeRenderHead(result)}
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

describe('Container with renderers', () => {
	let fixture: Fixture;
	let app: App;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/container-custom-renderers/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('the endpoint should return the HTML of the React component', async () => {
		const request = new Request('https://example.com/react');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a react button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});

	it('the endpoint should return the HTML of the React component, with DOCTYPE when rendered when partial is off', async () => {
		const request = new Request('https://example.com/react-as-page');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a react button/);
		assert.match(html, /<!DOCTYPE html>/);
	});

	it('the endpoint should return the HTML of the Vue component', async () => {
		const request = new Request('https://example.com/vue');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a vue button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});

	it('Should render a component with directives', async () => {
		const request = new Request('https://example.com/button-directive');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /Button not rendered/);
		assert.match(html, /I am a react button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});
});
