import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	handlePrerenderMetadataRequest,
	isPrerenderMetadataRequest,
	storePrerenderMetadata,
} from '../../dist/utils/prerender-metadata.js';

describe('prerender metadata transport', () => {
	it('matches only metadata endpoint GET requests', () => {
		assert.equal(
			isPrerenderMetadataRequest(
				new Request('http://localhost/__astro_prerender_metadata?id=metadata'),
			),
			true,
		);
		assert.equal(
			isPrerenderMetadataRequest(
				new Request('http://localhost/__astro_prerender_metadata', { method: 'POST' }),
			),
			false,
		);
	});

	it('returns and deletes stored metadata', async () => {
		storePrerenderMetadata('tracked', {
			status: 404,
			statusText: 'Expected Not Found',
			headers: [['content-type', 'text/plain']],
			hasBody: true,
			metadata: {
				contentEntryKeys: ['src/content/docs/one.mdx'],
				staticImages: [],
			},
		});
		const request = new Request('http://localhost/__astro_prerender_metadata?id=tracked');
		const response = handlePrerenderMetadataRequest(request);

		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			status: 404,
			statusText: 'Expected Not Found',
			headers: [['content-type', 'text/plain']],
			hasBody: true,
			metadata: {
				contentEntryKeys: ['src/content/docs/one.mdx'],
				staticImages: [],
			},
		});
		assert.equal(handlePrerenderMetadataRequest(request).status, 404);
	});

	it('preserves unavailable metadata without treating the lookup as missing', async () => {
		storePrerenderMetadata('unavailable', {
			status: 200,
			statusText: '',
			headers: [],
			hasBody: false,
			metadata: undefined,
		});
		const response = handlePrerenderMetadataRequest(
			new Request('http://localhost/__astro_prerender_metadata?id=unavailable'),
		);

		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			status: 200,
			statusText: '',
			headers: [],
			hasBody: false,
		});
	});

	it('rejects missing and unknown IDs', () => {
		assert.equal(
			handlePrerenderMetadataRequest(new Request('http://localhost/__astro_prerender_metadata'))
				.status,
			400,
		);
		assert.equal(
			handlePrerenderMetadataRequest(
				new Request('http://localhost/__astro_prerender_metadata?id=unknown'),
			).status,
			404,
		);
	});
});
