import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { createServer, type ViteDevServer } from 'vite';

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
					if (id === '\0react-options') return 'export default {}';
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

// Mimics the progressive enhancement metadata that `withState(actions.like)` attaches.
function likeAction() {}
likeAction.$$FORM_ACTION = () => ({ action: '?_action=like', data: new FormData() });
likeAction.$$IS_SIGNATURE_EQUAL = (name: string) => name === 'like';
// React binds the initial state with `.bind()`, which would drop `$$FORM_ACTION`.
likeAction.bind = () => likeAction;

function Like({ postId }: { postId: string }) {
	const [state, action] = React.useActionState(likeAction as any, 0);
	return React.createElement(
		'form',
		{ action, id: postId },
		React.createElement('button', null, `${postId}: ${state}`),
	);
}

async function renderIslands(request: Request, actionResult?: unknown) {
	const context = { result: { request, actionResult }, options: {} };
	const htmls: string[] = [];
	for (const postId of ['a', 'b']) {
		const { html } = await renderer.renderToStaticMarkup.call(context, Like, { postId }, {});
		htmls.push(html);
	}
	return htmls;
}

test('applies a no-JS useActionState result only to the island that submitted the form', async () => {
	const [, formB] = await renderIslands(new Request('http://localhost/'));
	const actionKey = /name="\$ACTION_KEY" value="([^"]+)"/.exec(formB)?.[1];
	assert.ok(actionKey, formB);

	const body = new URLSearchParams({ $ACTION_KEY: actionKey });
	const [islandA, islandB] = await renderIslands(
		new Request('http://localhost/?_action=like', { method: 'POST', body }),
		1,
	);
	assert.ok(islandA.includes('a: 0'), islandA);
	assert.ok(islandB.includes('b: 1'), islandB);
});
