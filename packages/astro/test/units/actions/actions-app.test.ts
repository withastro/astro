import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as devalue from 'devalue';
import { z } from 'zod';
import { defineAction } from '../../../dist/actions/runtime/server.js';
import { ActionError } from '../../../dist/actions/runtime/client.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createTestApp, createPage, createRouteData } from '../mocks.ts';
import { spreadPart, staticPart } from '../routing/test-helpers.ts';
import type { RouteData } from '../../../dist/types/public/internal.js';

const noopPage = createComponent(() => render``);

const actionRouteData: RouteData = createRouteData({
	route: '/_actions/[...path]',
	type: 'endpoint',
	component: 'astro/actions/runtime/entrypoints/route.js',
	segments: [[staticPart('_actions')], [spreadPart('...path')]],
	pathname: undefined,
});

function createActionsApp(
	serverActions: Record<string, ReturnType<typeof defineAction>>,
	options: { actionBodySizeLimit?: number } = {},
) {
	return createTestApp(
		[
			createPage(noopPage, { route: '/test' }),
			{
				routeData: actionRouteData,
				// The action entrypoint isn't a page component, but App routes it by matching.
				module: (async () => ({
					page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
				})) as any,
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

// #region Form schema tests (nested objects, discriminated unions, refine, transform)

const passwordSchema = z
	.string()
	.min(8, 'Password should be at least 8 chars length')
	.max(128, 'Password length exceeded. Max 128 chars.');

describe('Actions form schema handling', () => {
	const app = createActionsApp({
		nestedFormObject: defineAction({
			accept: 'form',
			input: z.object({
				a: z.string(),
				bc: z
					.object({
						b: z.enum(['hoge', 'huga']),
						c: z.string().optional(),
					})
					.superRefine((data, ctx) => {
						if (data.b === 'huga' && (!data.c || data.c.trim() === '')) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								path: ['bc', 'c'],
								message: 'C is required when B is "huga"',
							});
						}
					}),
			}),
			handler: async (data) => data,
		}),
		nestedDiscriminatedUnion: defineAction({
			accept: 'form',
			input: z.object({
				name: z.string(),
				contact: z.discriminatedUnion('type', [
					z.object({ type: z.literal('email'), email: z.string() }),
					z.object({ type: z.literal('phone'), phone: z.string() }),
				]),
			}),
			handler: async (data) => data,
		}),
		validatePassword: defineAction({
			accept: 'form',
			input: z
				.object({ password: z.string(), confirmPassword: z.string() })
				.refine((data) => data.password === data.confirmPassword, {
					message: 'Passwords do not match',
				}),
			handler: async ({ password }) => password,
		}),
		validatePasswordComplex: defineAction({
			accept: 'form',
			input: z
				.object({
					currentPassword: passwordSchema,
					newPassword: passwordSchema,
					confirmNewPassword: passwordSchema,
				})
				.required()
				.refine(
					({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword,
					'The new password confirmation does not match',
				)
				.refine(
					({ currentPassword, newPassword }) => currentPassword !== newPassword,
					'The old password and the new password must not match',
				)
				.transform((input) => ({
					currentPassword: input.currentPassword,
					newPassword: input.newPassword,
				}))
				.pipe(
					z.object({
						currentPassword: passwordSchema,
						newPassword: passwordSchema,
					}),
				),
			handler: async (data) => data,
		}),
		transformFormInput: defineAction({
			accept: 'form',
			input: z.instanceof(FormData).transform((formData) => Object.fromEntries(formData.entries())),
			handler: async (data) => data,
		}),
		imageUploadInChunks: defineAction({
			accept: 'form',
			input: z.discriminatedUnion('type', [
				z.object({
					type: z.literal('first-chunk'),
					image: z.instanceof(File),
					alt: z.string(),
				}),
				z.object({
					type: z.literal('rest-chunk'),
					image: z.instanceof(File),
					uploadId: z.string(),
				}),
			]),
			handler: async (data) => {
				if (data.type === 'first-chunk') {
					return { uploadId: Math.random().toString(36).slice(2) };
				}
				return { uploadId: data.uploadId };
			},
		}),
	});

	it('handles nested form objects with dot notation', async () => {
		const formData = new FormData();
		formData.append('a', 'hello');
		formData.append('bc.b', 'hoge');
		formData.append('bc.c', 'world');
		const req = new Request('http://example.com/_actions/nestedFormObject', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.a, 'hello');
		assert.deepEqual(data.bc, { b: 'hoge', c: 'world' });
	});

	it('validates nested form objects with superRefine', async () => {
		const formData = new FormData();
		formData.append('a', 'hello');
		formData.append('bc.b', 'huga');
		// Omit bc.c to trigger superRefine validation
		const req = new Request('http://example.com/_actions/nestedFormObject', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, false);
		assert.equal(res.status, 400);
		const data = await res.json();
		assert.equal(data.type, 'AstroActionInputError');
		assert.ok(
			data.issues.some((issue: any) => issue.path.includes('c')),
			'Should have a validation issue for field c',
		);
	});

	it('handles nested discriminatedUnion in form data', async () => {
		const formData = new FormData();
		formData.append('name', 'Ben');
		formData.append('contact.type', 'email');
		formData.append('contact.email', 'ben@test.test');
		const req = new Request('http://example.com/_actions/nestedDiscriminatedUnion', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.name, 'Ben');
		assert.deepEqual(data.contact, { type: 'email', email: 'ben@test.test' });
	});

	it('supports effects on form input validators', async () => {
		const formData = new FormData();
		formData.set('password', 'benisawesome');
		formData.set('confirmPassword', 'benisveryawesome');
		const req = new Request('http://example.com/_actions/validatePassword', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, false);
		assert.equal(res.status, 400);
		assert.equal(res.headers.get('Content-Type'), 'application/json');
		const data = await res.json();
		assert.equal(data.type, 'AstroActionInputError');
		assert.equal(data.issues?.[0]?.message, 'Passwords do not match');
	});

	it('supports complex chained effects on form input validators', async () => {
		const formData = new FormData();
		formData.set('currentPassword', 'benisboring');
		formData.set('newPassword', 'benisawesome');
		formData.set('confirmNewPassword', 'benisawesome');
		const req = new Request('http://example.com/_actions/validatePasswordComplex', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(Object.keys(data).length, 2, 'More keys than expected');
		assert.deepEqual(data, {
			currentPassword: 'benisboring',
			newPassword: 'benisawesome',
		});
	});

	it('supports input form data transforms', async () => {
		const formData = new FormData();
		formData.set('name', 'ben');
		formData.set('age', '42');
		const req = new Request('http://example.com/_actions/transformFormInput', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);

		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data?.name, 'ben');
		assert.equal(data?.age, '42');
	});

	it('supports discriminated union for different form fields', async () => {
		const formData = new FormData();
		formData.set('type', 'first-chunk');
		formData.set('alt', 'Cool image');
		formData.set('image', new File([''], 'chunk-1.png'));
		const reqFirst = new Request('http://example.com/_actions/imageUploadInChunks', {
			method: 'POST',
			body: formData,
		});
		const resFirst = await app.render(reqFirst);
		assert.equal(resFirst.status, 200);
		assert.equal(resFirst.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await resFirst.text());
		assert.ok(data?.uploadId);

		const formDataRest = new FormData();
		formDataRest.set('type', 'rest-chunk');
		formDataRest.set('uploadId', 'fake');
		formDataRest.set('image', new File([''], 'chunk-2.png'));
		const reqRest = new Request('http://example.com/_actions/imageUploadInChunks', {
			method: 'POST',
			body: formDataRest,
		});
		const resRest = await app.render(reqRest);
		assert.equal(resRest.status, 200);
		const dataRest = devalue.parse(await resRest.text());
		assert.equal(dataRest?.uploadId, 'fake');
	});
});

// #endregion

// #region Middleware integration

describe('Actions RPC middleware handling', () => {
	it('blocks RPC when middleware guard rejects', async () => {
		const middlewareApp = createTestApp(
			[
				createPage(noopPage, { route: '/test' }),
				{
					routeData: actionRouteData,
					module: (async () => ({
						// NOTE: we intentionally import the built runtime
						page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
					})) as any,
				},
			],
			{
				actions: () => ({
					server: {
						locked: defineAction({
							handler: async () => ({ safe: true }),
						}),
					},
				}),
				actionBodySizeLimit: 1024 * 1024,
				middleware: async () => ({
					onRequest: async (ctx: any, next: any) => {
						if (ctx.url.pathname.includes('/_actions/locked') && !ctx.cookies.has('actionCookie')) {
							return new Response('Unauthorized', { status: 401 });
						}
						return next();
					},
				}),
			},
		);

		const req = new Request('http://example.com/_actions/locked', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}',
		});
		const res = await middlewareApp.render(req);
		assert.equal(res.status, 401);
	});

	it('allows RPC when middleware guard passes', async () => {
		const middlewareApp = createTestApp(
			[
				createPage(noopPage, { route: '/test' }),
				{
					routeData: actionRouteData,
					module: (async () => ({
						page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
					})) as any,
				},
			],
			{
				actions: () => ({
					server: {
						locked: defineAction({
							handler: async () => ({ safe: true }),
						}),
					},
				}),
				actionBodySizeLimit: 1024 * 1024,
				middleware: async () => ({
					onRequest: async (ctx: any, next: any) => {
						if (ctx.url.pathname.includes('/_actions/locked') && !ctx.cookies.has('actionCookie')) {
							return new Response('Unauthorized', { status: 401 });
						}
						return next();
					},
				}),
			},
		);

		const req = new Request('http://example.com/_actions/locked', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: 'actionCookie=1234',
			},
			body: '{}',
		});
		const res = await middlewareApp.render(req);
		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal('safe' in data, true);
	});
});

// #endregion

// #region Base path and trailing slash

describe('Actions routing options', () => {
	it('respects base path', async () => {
		const app = createTestApp(
			[
				createPage(noopPage, { route: '/test' }),
				{
					routeData: {
						...actionRouteData,
						// The action route still matches /_actions/* but with base prefix
						route: '/_actions/[...path]',
					} as RouteData,
					module: (async () => ({
						// NOTE: we intentionally import the built runtime
						page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
					})) as any,
				},
			],
			{
				base: '/base',
				actions: () => ({
					server: {
						comment: defineAction({
							accept: 'form',
							input: z.object({ channel: z.string(), comment: z.string() }),
							handler: async ({ channel, comment }) => ({ channel, comment }),
						}),
					},
				}),
				actionBodySizeLimit: 1024 * 1024,
			},
		);

		const formData = new FormData();
		formData.append('channel', 'bholmesdev');
		formData.append('comment', 'Hello, World!');
		const req = new Request('http://example.com/base/_actions/comment', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.channel, 'bholmesdev');
		assert.equal(data.comment, 'Hello, World!');
	});

	it('supports trailing slash', async () => {
		const app = createTestApp(
			[
				createPage(noopPage, { route: '/test' }),
				{
					routeData: {
						...actionRouteData,
						route: '/_actions/[...path]',
					} as RouteData,
					module: (async () => ({
						// NOTE: we intentionally import the built runtime
						page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
					})) as any,
				},
			],
			{
				trailingSlash: 'always',
				actions: () => ({
					server: {
						comment: defineAction({
							accept: 'form',
							input: z.object({ channel: z.string(), comment: z.string() }),
							handler: async ({ channel, comment }) => ({ channel, comment }),
						}),
					},
				}),
				actionBodySizeLimit: 1024 * 1024,
			},
		);

		const formData = new FormData();
		formData.append('channel', 'bholmesdev');
		formData.append('comment', 'Hello, World!');
		const req = new Request('http://example.com/_actions/comment/', {
			method: 'POST',
			body: formData,
		});
		const res = await app.render(req);
		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');
		const data = devalue.parse(await res.text());
		assert.equal(data.channel, 'bholmesdev');
		assert.equal(data.comment, 'Hello, World!');
	});
});

// #endregion
