// @ts-check
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { callMiddleware } from '../../../dist/core/middleware/callMiddleware.js';
import { sequence } from '../../../dist/core/middleware/sequence.js';
import { createMockAPIContext, createResponseFunction } from './test-helpers.js';

describe('sequence', () => {
	/** @type {import('astro').APIContext} */
	let globaCtx;

	beforeEach(() => {
		globaCtx = createMockAPIContext();
	});

	it('returns a passthrough middleware when called with no handlers', async () => {
		const combined = sequence();
		const responseFn = createResponseFunction('passthrough');

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'passthrough');
	});

	it('works with a single handler', async () => {
		const handler = async (ctx, next) => {
			ctx.locals.touched = true;
			return next();
		};
		const combined = sequence(handler);
		const responseFn = createResponseFunction('single');

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'single');
		assert.equal(globaCtx.locals.touched, true);
	});

	it('executes handlers in order', async () => {
		const order = [];
		const handler1 = async (_ctx, next) => {
			order.push(1);
			return next();
		};
		const handler2 = async (_ctx, next) => {
			order.push(2);
			return next();
		};
		const handler3 = async (_ctx, next) => {
			order.push(3);
			return next();
		};
		const combined = sequence(handler1, handler2, handler3);
		const responseFn = createResponseFunction();

		await callMiddleware(combined, globaCtx, responseFn);

		assert.deepEqual(order, [1, 2, 3]);
	});

	it('propagates context mutations across handlers', async () => {
		const first = async (ctx, next) => {
			ctx.locals.first = 'a';
			return next();
		};
		const second = async (ctx, next) => {
			// should see mutation from first
			ctx.locals.second = ctx.locals.first + 'b';
			return next();
		};
		const combined = sequence(first, second);
		const responseFn = async (apiCtx) => {
			return new Response(`${apiCtx.locals.first}-${apiCtx.locals.second}`);
		};

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'a-ab');
	});

	it('allows the last handler to modify the response from the page', async () => {
		const handler1 = async (_ctx, next) => {
			return next();
		};
		const handler2 = async (_ctx, next) => {
			const response = await next();
			const text = await response.text();
			return new Response(text.toUpperCase());
		};
		const combined = sequence(handler1, handler2);
		const responseFn = createResponseFunction('hello world');

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'HELLO WORLD');
	});

	it('supports mixed sync and async handlers', async () => {
		const syncHandler = (_ctx, next) => {
			return next();
		};
		const asyncHandler = async (ctx, next) => {
			ctx.locals.async = true;
			return await next();
		};
		const combined = sequence(syncHandler, asyncHandler);
		const responseFn = createResponseFunction('mixed');

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'mixed');
		assert.equal(globaCtx.locals.async, true);
	});

	it('filters out falsy handlers', async () => {
		const order = [];
		const handler1 = async (_ctx, next) => {
			order.push(1);
			return next();
		};
		const handler2 = async (_ctx, next) => {
			order.push(2);
			return next();
		};
		const combined = sequence(handler1, null, undefined, handler2);
		const responseFn = createResponseFunction();

		await callMiddleware(combined, globaCtx, responseFn);

		assert.deepEqual(order, [1, 2]);
	});

	it('allows earlier handlers to short-circuit the chain', async () => {
		const order = [];
		const handler1 = async () => {
			order.push(1);
			return new Response('short-circuit');
		};
		const handler2 = async (_ctx, next) => {
			order.push(2);
			return next();
		};
		const combined = sequence(handler1, handler2);
		const responseFn = createResponseFunction('should not reach');

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(await response.text(), 'short-circuit');
		assert.deepEqual(order, [1]); // handler2 was never called
	});

	it('accumulates cookies set by multiple handlers', async () => {
		const handler1 = async (ctx, next) => {
			ctx.cookies.set('cookie1', 'value1');
			return next();
		};
		const handler2 = async (ctx, next) => {
			ctx.cookies.set('cookie2', 'value2');
			return next();
		};
		const combined = sequence(handler1, handler2);
		const responseFn = createResponseFunction('OK');

		await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(globaCtx.cookies.get('cookie1')?.value, 'value1');
		assert.equal(globaCtx.cookies.get('cookie2')?.value, 'value2');
	});

	it('handles a chain where middle handler returns a redirect', async () => {
		const handler1 = async (ctx, next) => {
			ctx.locals.beforeRedirect = true;
			return next();
		};
		const handler2 = async (ctx) => {
			return ctx.redirect('/login');
		};
		const handler3 = async (_ctx, next) => {
			// should never be called
			return next();
		};
		const combined = sequence(handler1, handler2, handler3);
		const responseFn = createResponseFunction();

		const response = await callMiddleware(combined, globaCtx, responseFn);

		assert.equal(response.status, 302);
		assert.equal(response.headers.get('Location'), '/login');
		assert.equal(globaCtx.locals.beforeRedirect, true);
	});
});
