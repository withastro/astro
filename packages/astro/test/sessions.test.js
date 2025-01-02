import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Astro.session', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/sessions/',
			output: 'server',
			adapter: testAdapter(),
		});
	});

	describe('Production', () => {
		let app;
		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		async function fetchResponse(path, requestInit) {
			const request = new Request('http://example.com' + path, requestInit);
			const response = await app.render(request);
			return response;
		}

		it('can regenerate session cookies upon request', async () => {
			const firstResponse = await fetchResponse('/regenerate', { method: 'GET' });
			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const secondResponse = await fetchResponse('/regenerate', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			const secondHeaders = Array.from(app.setCookieHeaders(secondResponse));
			const secondSessionId = secondHeaders[0].split(';')[0].split('=')[1];
			assert.notEqual(firstSessionId, secondSessionId);
		});
	});
});
