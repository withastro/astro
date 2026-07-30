import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getFetchStateFromAPIContext } from '../../../dist/core/fetch/fetch-state.js';
import { createEndpoint, createTestApp } from '../mocks.ts';

describe('context provider finalization', () => {
	it('still produces a response when a provider finalize callback rejects', async () => {
		const endpoint = createEndpoint(
			{
				GET: (ctx) => {
					const state = getFetchStateFromAPIContext(ctx);
					state.provide('unit-probe', {
						create: () => ({}),
						finalize: () => Promise.reject(new Error('finalize failure')),
					});
					// Resolve the provider so it is included in finalizeAll().
					state.resolve('unit-probe');
					return new Response('ok');
				},
			},
			{ route: '/probe' },
		);
		const app = createTestApp([endpoint]);
		const request = new Request('http://example.com/probe');

		const response = await app.render(request);
		assert.equal(response.status, 500);
	});
});
