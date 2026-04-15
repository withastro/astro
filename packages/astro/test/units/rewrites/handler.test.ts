import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRewritesHandler } from '../../../dist/core/rewrites/handler.js';
import { FetchState } from '../../../dist/core/app/fetch-state.js';

/**
 * Minimal deps — only the fields read before rendering is reached.
 * The loop guard and no-op paths never touch the pipeline or manifest.
 */
const pipeline = {
	runtimeMode: 'production',
	manifestData: { routes: [] },
	manifest: { sessionConfig: undefined, csp: undefined },
	logger: { warn() {}, error() {}, info() {}, debug() {} },
	i18n: undefined,
	site: undefined,
	adapterName: undefined,
	cacheConfig: undefined,
	async getSessionDriver() { return undefined; },
} as any;
const deps = {
	pipeline,
	manifest: {} as any,
	logger: { error() {}, warn() {}, info() {}, debug() {} } as any,
};

describe('createRewritesHandler', () => {
	describe('when no rewrite is pending', () => {
		it('returns undefined', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const state = new FetchState(new Request('http://localhost/page'), pipeline);
			const result = await handler(state);
			assert.equal(result, undefined);
		});

		it('does not modify state', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const state = new FetchState(new Request('http://localhost/page'), pipeline);
			await handler(state);
			assert.equal(state.rewriteCount, 0);
			assert.equal(state.rewritePathname, undefined);
			assert.equal(state.routeData, undefined);
		});
	});

	describe('loop detection', () => {
		it('returns 508 when rewrite count reaches 4', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const state = new FetchState(new Request('http://localhost/page'), pipeline);
			state.rewritePathname = '/loop';
			state.rewriteCount = 3;

			const result = await handler(state);
			assert.ok(result);
			assert.equal(result.status, 508);
		});

		it('clears rewritePathname on loop detection', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const state = new FetchState(new Request('http://localhost/page'), pipeline);
			state.rewritePathname = '/loop';
			state.rewriteCount = 3;

			await handler(state);
			assert.equal(state.rewritePathname, undefined);
		});

		it('increments rewriteCount', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const state = new FetchState(new Request('http://localhost/page'), pipeline);
			state.rewritePathname = '/a';
			state.rewriteCount = 2;

			await handler(state);
			assert.equal(state.rewriteCount, 3);

			state.rewritePathname = '/b';
			const result = await handler(state);
			assert.equal(state.rewriteCount, 4);
			assert.equal(result?.status, 508);
		});
	});

	describe('bodyUsed guard', () => {
		it('throws when request body is already consumed', async () => {
			const handler = createRewritesHandler(deps, () => undefined);
			const request = new Request('http://localhost/page', { method: 'POST', body: 'data' });
			const state = new FetchState(request, pipeline);
			state.rewritePathname = '/target';
			await request.text();

			await assert.rejects(
				() => handler(state),
				(err: any) => {
					assert.ok(err.name === 'AstroError' || err.message.includes('body'));
					return true;
				},
			);
		});
	});
});
