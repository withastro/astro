import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let previewServer;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/api-routes/' });
		await fixture.build();
	});

	describe('Binary data', () => {
		it('can be returned from a response', async () => {
			const dat = await fixture.readFile('/binary.dat', null);
			assert.equal(dat.length, 1);
			assert.equal(dat[0], 0xff);
		});
	});

	describe('custom status', () => {
		before(async () => {
			previewServer = await fixture.preview();
		});

		it('should return a custom status code and empty body for HEAD', async () => {
			const response = await fixture.fetch('/custom-status', { method: 'HEAD' });
			const text = await response.text();
			assert.equal(response.status, 403);
			assert.equal(text, '');
		});

		it('should return a 403 status code with the correct body for GET', async () => {
			const response = await fixture.fetch('/custom-status');
			const text = await response.text();
			assert.equal(response.status, 403);
			assert.equal(text, 'hello world');
		});

		it('should return the correct headers for GET', async () => {
			const response = await fixture.fetch('/custom-status');
			const headers = response.headers.get('x-hello');
			assert.equal(headers, 'world');
		});

		it('should return the correct headers for HEAD', async () => {
			const response = await fixture.fetch('/custom-status', { method: 'HEAD' });
			const headers = response.headers.get('x-hello');
			assert.equal(headers, 'world');
		});
		after(async () => {
			await previewServer.stop();
		});
	});
});
