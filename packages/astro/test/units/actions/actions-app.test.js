// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as devalue from 'devalue';
import { z } from 'zod';
import { defineAction } from '../../../dist/actions/runtime/server.js';
import { ActionError } from '../../../dist/actions/runtime/client.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createTestApp, createPage, createRouteData } from '../mocks.js';
import { spreadPart, staticPart } from '../routing/test-helpers.js';

const noopPage = createComponent(() => render``);

const actionRouteData = createRouteData({
	route: '/_actions/[...path]',
	type: 'endpoint',
	component: 'astro/actions/runtime/entrypoints/route.js',
	segments: [[staticPart('_actions')], [spreadPart('...path')]],
	pathname: undefined,
});

/**
 * Creates an App wired up with action handlers at `/_actions/[...path]`.
 *
 * @param {Record<string, any>} serverActions - The `server` export from an actions file
 * @param {object} [options]
 * @param {number} [options.actionBodySizeLimit]
 */
function createActionsApp(serverActions, options = {}) {
	return createTestApp(
		[
			createPage(noopPage, { route: '/test' }),
			{
				routeData: actionRouteData,
				module: async () => ({
					page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
				}),
			},
		],
		{
			actions: () => ({ server: serverActions }),
			actionBodySizeLimit: options.actionBodySizeLimit ?? 1024 * 1024,
		},
	);
}

describe('Actions via App', () => {
	const app = createActionsApp({
		subscribe: defineAction({
			input: z.object({ channel: z.string() }),
			handler: async ({ channel }) => ({
				channel,
				subscribeButtonState: 'smashed',
			}),
		}),
		comment: defineAction({
			accept: 'form',
			input: z.object({ channel: z.string(), comment: z.string() }),
			handler: async ({ channel, comment }) => ({ channel, comment }),
		}),
		commentPlainFormData: defineAction({
			accept: 'form',
			handler: async (formData) => ({
				success: true,
				isFormData: formData instanceof FormData,
			}),
		}),
		fireAndForget: defineAction({
			handler: async () => {
				return;
			},
		}),
		getUserOrThrow: defineAction({
			accept: 'form',
			handler: async () => {
				throw new ActionError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
			},
		}),
		'with space': defineAction({
			input: z.object({ name: z.string() }),
			handler: async (input) => `Hello, ${input.name}!`,
		}),
		'with/slash': defineAction({
			input: z.object({ name: z.string() }),
			handler: async (input) => `Hello, ${input.name}!`,
		}),
	});

	it('exposes a JSON action (subscribe)', async () => {
		const req = new Request('http://example.com/_actions/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ channel: 'bholmesdev' }),
		});
		const res = await app.render(req);
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.channel, 'bholmesdev');
		assert.equal(data.subscribeButtonState, 'smashed');
	});

	it('exposes a form action (comment)', async () => {
		const formData = new FormData();
		formData.append('channel', 'bholmesdev');
		formData.append('comment', 'Hello, World!');
		const req = new Request('http://example.com/_actions/comment', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.channel, 'bholmesdev');
		assert.equal(data.comment, 'Hello, World!');
	});

	it('exposes plain formData action', async () => {
		const formData = new FormData();
		formData.append('anything', 'works');
		const req = new Request('http://example.com/_actions/commentPlainFormData', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.status, 200);
		const data = devalue.parse(await res.text());
		assert.equal(data.success, true);
		assert.equal(data.isFormData, true);
	});

	it('returns 404 for nonexistent action', async () => {
		const req = new Request('http://example.com/_actions/doesNotExist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
		const res = await app.render(req);
		assert.equal(res.status, 404);
	});

	it('returns 404 for prototype methods used as action names', async () => {
		const req = new Request('http://example.com/_actions/toString', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
		const res = await app.render(req);
		assert.equal(res.status, 404);
	});

	it('returns 404 for GET requests', async () => {
		const req = new Request('http://example.com/_actions/subscribe', {
			method: 'GET',
		});
		const res = await app.render(req);
		assert.equal(res.status, 404);
	});

	it('returns 204 for void action (fire and forget)', async () => {
		const req = new Request('http://example.com/_actions/fireAndForget', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': '0',
			},
		});
		const res = await app.render(req);
		assert.equal(res.status, 204);
	});

	it('respects custom errors', async () => {
		const formData = new FormData();
		const req = new Request('http://example.com/_actions/getUserOrThrow', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.status, 401);
		const body = await res.json();
		assert.equal(body.type, 'AstroActionError');
		assert.equal(body.code, 'UNAUTHORIZED');
		assert.equal(body.message, 'Not logged in');
	});

	it('raises validation error on bad form data', async () => {
		const formData = new FormData();
		formData.append('channel', 'bholmesdev');
		// missing required 'comment' field
		const req = new Request('http://example.com/_actions/comment', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.status, 400);
		const body = await res.json();
		assert.equal(body.type, 'AstroActionInputError');
		assert.ok(Array.isArray(body.issues));
	});

	it('handles special characters in action names (space)', async () => {
		const req = new Request('http://example.com/_actions/with%20space', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Ben' }),
		});
		const res = await app.render(req);
		assert.equal(res.status, 200);
		const data = devalue.parse(await res.text());
		assert.equal(data, 'Hello, Ben!');
	});

	it('handles special characters in action names (slash)', async () => {
		const req = new Request('http://example.com/_actions/with%2Fslash', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Ben' }),
		});
		const res = await app.render(req);
		assert.equal(res.status, 200);
		const data = devalue.parse(await res.text());
		assert.equal(data, 'Hello, Ben!');
	});
});

describe('Actions body size limit', () => {
	it('rejects oversized JSON body', async () => {
		const app = createActionsApp(
			{
				subscribe: defineAction({
					input: z.object({ channel: z.string() }),
					handler: async ({ channel }) => ({ channel }),
				}),
			},
			{ actionBodySizeLimit: 100 },
		);
		const body = JSON.stringify({ channel: 'x'.repeat(200) });
		const req = new Request('http://example.com/_actions/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
		const res = await app.render(req);
		assert.equal(res.status, 413);
		const json = await res.json();
		assert.equal(json.code, 'CONTENT_TOO_LARGE');
	});

	it('returns 204 when content-length is 0', async () => {
		const app = createActionsApp({
			fireAndForget: defineAction({
				handler: async () => {
					return;
				},
			}),
		});
		const req = new Request('http://example.com/_actions/fireAndForget', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Content-Length': '0' },
		});
		const res = await app.render(req);
		assert.equal(res.status, 204);
	});

	it('returns 204 when content-type is omitted', async () => {
		const app = createActionsApp({
			fireAndForget: defineAction({
				handler: async () => {
					return;
				},
			}),
		});
		const req = new Request('http://example.com/_actions/fireAndForget', {
			method: 'POST',
			headers: { 'Content-Length': '0' },
		});
		const res = await app.render(req);
		assert.equal(res.status, 204);
	});

	it('returns 415 when content-type is unexpected', async () => {
		const app = createActionsApp({
			subscribe: defineAction({
				input: z.object({ channel: z.string() }),
				handler: async ({ channel }) => ({ channel }),
			}),
		});
		const req = new Request('http://example.com/_actions/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: 'not json',
		});
		const res = await app.render(req);
		assert.equal(res.status, 415);
	});
});
