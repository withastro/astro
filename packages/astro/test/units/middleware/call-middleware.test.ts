// @ts-check
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { callMiddleware } from '../../../dist/core/middleware/callMiddleware.js';
import { createMockAPIContext, createResponseFunction } from './test-helpers.js';

describe('callMiddleware', () => {
	/** @type {import('astro').APIContext} */
	let ctx;
	const defaultResponseFn = createResponseFunction();

	beforeEach(() => {
		ctx = createMockAPIContext();
	});

	describe('next() called', () => {
		it('returns the middleware return value when next() is called and a Response is returned', async () => {
			const middleware = async (_ctx, next) => {
				const response = await next();
				return new Response('modified', { status: 200, headers: response.headers });
			};

			const response = await callMiddleware(middleware, ctx, createResponseFunction('original'));

			assert.equal(await response.text(), 'modified');
		});

		it('returns the responseFunction result when next() is called but middleware returns undefined', async () => {
			const middleware = async (_ctx, next) => {
				await next();
				// deliberately returns undefined
			};

			const response = await callMiddleware(middleware, ctx, createResponseFunction('from page'));

			assert.equal(await response.text(), 'from page');
		});

		it('throws MiddlewareNotAResponse when next() is called but middleware returns a non-Response', async () => {
			const middleware = async (_ctx, next) => {
				await next();
				return 'not a response';
			};

			await assert.rejects(
				() => callMiddleware(middleware, ctx, defaultResponseFn),
				(err) => {
					assert.equal(err.name, 'MiddlewareNotAResponse');
					return true;
				},
			);
		});
	});

	describe('next() not called', () => {
		it('returns the Response when middleware short-circuits without calling next()', async () => {
			const middleware = async () => {
				return new Response('short-circuit', { status: 200 });
			};

			const response = await callMiddleware(middleware, ctx, defaultResponseFn);

			assert.equal(await response.text(), 'short-circuit');
			assert.equal(response.status, 200);
		});

		it('returns a 500 Response when middleware short-circuits with an error status', async () => {
			const middleware = async () => {
				return new Response(null, { status: 500 });
			};

			const response = await callMiddleware(middleware, ctx, defaultResponseFn);

			assert.equal(response.status, 500);
		});

		it('throws MiddlewareNoDataOrNextCalled when middleware returns undefined without calling next()', async () => {
			const middleware = async () => {
				// returns undefined, never calls next
			};

			await assert.rejects(
				() => callMiddleware(middleware, ctx, defaultResponseFn),
				(err) => {
					assert.equal(err.name, 'MiddlewareNoDataOrNextCalled');
					return true;
				},
			);
		});

		it('throws MiddlewareNotAResponse when middleware returns a non-Response without calling next()', async () => {
			const middleware = async () => {
				return 'not a response';
			};

			await assert.rejects(
				() => callMiddleware(middleware, ctx, defaultResponseFn),
				(err) => {
					assert.equal(err.name, 'MiddlewareNotAResponse');
					return true;
				},
			);
		});
	});

	describe('context mutation', () => {
		it('locals mutations are visible in the response function', async () => {
			const middleware = async (context, next) => {
				context.locals.name = 'bar';
				return next();
			};
			const responseFn = async (apiCtx) => {
				return new Response(`name=${apiCtx.locals.name}`);
			};

			const response = await callMiddleware(middleware, ctx, responseFn);

			assert.equal(await response.text(), 'name=bar');
		});

		it('middleware can set response headers after calling next()', async () => {
			const middleware = async (_context, next) => {
				const response = await next();
				response.headers.set('X-Custom', 'value');
				return response;
			};

			const response = await callMiddleware(middleware, ctx, createResponseFunction('OK'));

			assert.equal(response.headers.get('X-Custom'), 'value');
		});

		it('middleware can clone the response, modify body, and return a new Response', async () => {
			const middleware = async (_context, next) => {
				const response = await next();
				const cloned = response.clone();
				const html = await cloned.text();
				const modified = html.replace('testing', 'it works');
				return new Response(modified, { status: 200, headers: response.headers });
			};

			const response = await callMiddleware(
				middleware,
				ctx,
				createResponseFunction('<p>testing</p>'),
			);

			assert.equal(await response.text(), '<p>it works</p>');
		});

		it('middleware can intercept a JSON response, modify it, and return a new Response', async () => {
			const middleware = async (_context, next) => {
				const response = await next();
				const data = await response.json();
				data.name = 'REDACTED';
				return new Response(JSON.stringify(data), {
					headers: { 'Content-Type': 'application/json' },
				});
			};

			const response = await callMiddleware(
				middleware,
				ctx,
				createResponseFunction(JSON.stringify({ name: 'secret', value: 42 }), {
					headers: { 'Content-Type': 'application/json' },
				}),
			);
			const body = await response.json();

			assert.equal(body.name, 'REDACTED');
			assert.equal(body.value, 42);
		});
	});

	describe('synchronous middleware', () => {
		it('works with a synchronous middleware that calls next()', async () => {
			const middleware = (_context, next) => {
				return next();
			};

			const response = await callMiddleware(middleware, ctx, createResponseFunction('sync OK'));

			assert.equal(await response.text(), 'sync OK');
		});

		it('works with a synchronous middleware that returns a Response', async () => {
			const middleware = () => {
				return new Response('sync short-circuit');
			};

			const response = await callMiddleware(middleware, ctx, defaultResponseFn);

			assert.equal(await response.text(), 'sync short-circuit');
		});
	});
});
