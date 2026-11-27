import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import React from 'react';
import { createServer, type ViteDevServer } from 'vite';

// A form submitted without JavaScript must set the `useActionState()` state of the island it
// came from, not of every island of the same component.
// See https://github.com/withastro/astro/issues/18874
describe('useActionState() in islands of one component', () => {
	let server: ViteDevServer;
	let renderer: any;

	before(async () => {
		server = await createServer({
			configFile: false,
			server: { middlewareMode: true },
			plugins: [
				{
					name: 'react-renderer-options',
					resolveId(id) {
						if (id === 'astro:react:opts') return '\0react-options';
					},
					load(id) {
						if (id === '\0react-options') {
							return `export default ${JSON.stringify({ experimentalDisableStreaming: false })}`;
						}
					},
				},
			],
		});
		({ default: renderer } = await server.ssrLoadModule(
			new URL('../src/server.ts', import.meta.url).pathname,
		));
	});

	after(async () => {
		await server.close();
	});

	// The shape of an Astro action passed through `withState()`: React reads `$$FORM_ACTION` for
	// the form's fields and `$$IS_SIGNATURE_EQUAL` to match it against `formState`.
	const like = Object.assign(async () => 'liked', {
		$$FORM_ACTION: () => ({ action: '/?_action=like', method: 'POST', data: new FormData() }),
		$$IS_SIGNATURE_EQUAL: (actionName: string) => actionName === 'like',
	});
	Object.defineProperty(like, 'bind', { value: () => like });

	function Like() {
		const [state, formAction] = React.useActionState(like, 'initial');
		return React.createElement(
			'form',
			{ action: formAction },
			React.createElement('output', null, state),
		);
	}

	/** Renders one island per entry of `islandProps` for one page, in order. */
	async function renderPage(result: object, islandProps: Record<string, any>[]) {
		const context = { result, options: {} };
		const html: string[] = [];
		for (const props of islandProps) {
			html.push((await renderer.renderToStaticMarkup.call(context, Like, props, {})).html);
		}
		return html;
	}

	const getPage = () => ({ request: new Request('http://localhost/') });
	const actionKey = (html: string) => /name="\$ACTION_KEY" value="([^"]+)"/.exec(html)?.[1];

	it('applies the state only to the island that submitted it', async () => {
		const [first, second] = await renderPage(getPage(), [{}, {}]);
		const secondKey = actionKey(second);
		assert.ok(secondKey, second);
		assert.notEqual(actionKey(first), secondKey);

		const body = new FormData();
		body.set('$ACTION_KEY', secondKey);
		const request = new Request('http://localhost/?_action=like', { method: 'POST', body });
		const [firstAfter, secondAfter] = await renderPage({ request, actionResult: 'liked' }, [
			{},
			{},
		]);
		assert.ok(firstAfter.includes('<output>initial</output>'), firstAfter);
		assert.ok(secondAfter.includes('<output>liked</output>'), secondAfter);
	});

	it('keeps the key of the first island and of islands given a key', async () => {
		const [alone] = await renderPage(getPage(), [{}]);
		const [first, userKeyed] = await renderPage(getPage(), [{}, { key: 'b' }]);
		const [userKeyedFirst] = await renderPage(getPage(), [{ key: 'b' }]);
		assert.equal(actionKey(first), actionKey(alone));
		assert.notEqual(actionKey(userKeyedFirst), actionKey(alone));
		assert.equal(actionKey(userKeyed), actionKey(userKeyedFirst));

		const keys = (await renderPage(getPage(), [{ key: '1' }, {}, {}])).map(actionKey);
		assert.equal(new Set(keys).size, 3, keys.join(', '));
	});
});
