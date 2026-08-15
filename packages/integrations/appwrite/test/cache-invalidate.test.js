import * as assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, beforeEach, describe, it } from 'node:test';
import factory from '../dist/cache/provider.js';

/**
 * The invalidation path is exercised against a stub of the Appwrite API rather
 * than a mocked SDK, so the test covers the request the SDK actually sends:
 * the endpoint it hits, the project and key headers it authenticates with, and
 * the payload the invalidation endpoint validates.
 */
let received = [];

// Started before the suite is declared, so that a provider built at declaration
// time can never fall back to the real Appwrite endpoint.
const { server, endpoint } = await (async () => {
	const stub = createServer((request, response) => {
		const chunks = [];
		request.on('data', (chunk) => chunks.push(chunk));
		request.on('end', () => {
			const body = Buffer.concat(chunks).toString();
			const payload = body ? JSON.parse(body) : undefined;
			received.push({
				method: request.method,
				url: request.url,
				headers: request.headers,
				body: payload,
			});

			if (payload?.reference === 'boom') {
				response.writeHead(400, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ message: 'Tag reference is invalid', code: 400 }));
				return;
			}

			response.writeHead(201, { 'content-type': 'application/json' });
			response.end(
				JSON.stringify({
					domain: payload?.domain ?? '',
					type: payload?.type ?? '',
					reference: payload?.reference ?? '',
					status: 'pending',
				}),
			);
		});
	});

	await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));

	return { server: stub, endpoint: `http://127.0.0.1:${stub.address().port}/v1` };
})();

after(() => server.close());

beforeEach(() => {
	received = [];
});

/**
 * Invalidate from inside a request, the way a page or an API route does, so the
 * provider sees the request the invalidation belongs to.
 */
function invalidateWhileServing(provider, options, { apiKey = 'dynamic-key' } = {}) {
	const request = new Request('https://example.appwrite.network/api/revalidate', {
		method: 'POST',
		headers: { 'x-appwrite-key': apiKey },
	});

	return provider.onRequest({ request, url: new URL(request.url) }, async () => {
		await provider.invalidate(options);
		return new Response('ok');
	});
}

describe('invalidate', () => {
	const provider = factory({ endpoint, projectId: 'my-project' });

	it('purges a tag on the domain the request was served on', async () => {
		await invalidateWhileServing(provider, { tags: ['products'] });

		assert.equal(received.length, 1);
		const [call] = received;
		assert.equal(call.method, 'POST');
		assert.equal(call.url, '/v1/proxy/invalidations');
		assert.deepEqual(call.body, {
			domain: 'example.appwrite.network',
			type: 'tag',
			reference: 'products',
		});
	});

	it('authenticates with the project and the dynamic key from the request', async () => {
		await invalidateWhileServing(provider, { tags: ['products'] }, { apiKey: 'a-dynamic-key' });

		const [{ headers }] = received;
		assert.equal(headers['x-appwrite-project'], 'my-project');
		assert.equal(headers['x-appwrite-key'], 'a-dynamic-key');
	});

	it('purges a path', async () => {
		await invalidateWhileServing(provider, { path: '/products/123' });

		assert.deepEqual(received[0].body, {
			domain: 'example.appwrite.network',
			type: 'path',
			reference: '/products/123',
		});
	});

	it('purges every tag and the path in one call each', async () => {
		await invalidateWhileServing(provider, { tags: ['products', 'featured'], path: '/products' });

		assert.deepEqual(received.map(({ body }) => `${body.type}:${body.reference}`).sort(), [
			'path:/products',
			'tag:featured',
			'tag:products',
		]);
	});

	it('purges each configured domain', async () => {
		const multiDomain = factory({
			endpoint,
			projectId: 'my-project',
			domain: ['example.com', 'www.example.com'],
		});

		await invalidateWhileServing(multiDomain, { tags: ['products'] });

		assert.deepEqual(received.map(({ body }) => body.domain).sort(), [
			'example.com',
			'www.example.com',
		]);
	});

	it('does not call the API when there is nothing to purge', async () => {
		await invalidateWhileServing(provider, {});

		assert.deepEqual(received, []);
	});

	it('does not call the API when no domain can be resolved', async () => {
		await assert.rejects(provider.invalidate({ tags: ['products'] }), {
			name: 'AppwriteCacheError',
		});
		assert.deepEqual(received, []);
	});

	it('surfaces an API error to the caller', async () => {
		await assert.rejects(invalidateWhileServing(provider, { tags: ['boom'] }), {
			message: 'Tag reference is invalid',
		});
	});
});
