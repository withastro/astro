import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertPrerenderResponse } from '../../dist/utils/prerender-response.js';

describe('assertPrerenderResponse', () => {
	it('does not throw for a 200 response', async () => {
		const response = new Response('ok', { status: 200 });
		await assertPrerenderResponse(response, 'test label');
	});

	it('does not throw for a 301 redirect', async () => {
		const response = new Response(null, { status: 301 });
		await assertPrerenderResponse(response, 'test label');
	});

	it('does not throw for a 404 response', async () => {
		const response = new Response('not found', { status: 404 });
		await assertPrerenderResponse(response, 'test label');
	});

	it('throws for a 500 response with body', async () => {
		const response = new Response('node:crypto is not available', {
			status: 500,
			statusText: 'Internal Server Error',
		});

		await assert.rejects(
			() => assertPrerenderResponse(response, 'Failed to prerender "/broken"'),
			(err: Error) => {
				assert.ok(err.message.includes('500'), 'should include status code');
				assert.ok(err.message.includes('Internal Server Error'), 'should include status text');
				assert.ok(err.message.includes('node:crypto'), 'should include response body');
				assert.ok(err.message.includes('Failed to prerender "/broken"'), 'should include label');
				return true;
			},
		);
	});

	it('throws for a 500 response with empty body', async () => {
		const response = new Response('', { status: 500, statusText: 'Internal Server Error' });

		await assert.rejects(
			() => assertPrerenderResponse(response, 'test label'),
			(err: Error) => {
				assert.ok(err.message.includes('500'));
				assert.ok(err.message.includes('Internal Server Error'));
				return true;
			},
		);
	});

	it('throws for a 502 response', async () => {
		const response = new Response('', { status: 502, statusText: 'Bad Gateway' });

		await assert.rejects(
			() => assertPrerenderResponse(response, 'test label'),
			(err: Error) => {
				assert.ok(err.message.includes('502'));
				assert.ok(err.message.includes('Bad Gateway'));
				return true;
			},
		);
	});
});
