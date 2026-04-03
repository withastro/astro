import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../test-utils.js';

describe('endpoints', () => {
	/** @type {import('../../test-utils.js').Fixture} */
	let fixture;
	/** @type {import('../../test-utils.js').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/endpoint-routing/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should respond with 500 for incorrect implementation', async () => {
		const res = await fixture.fetch('/incorrect');
		assert.equal(res.status, 500);
	});

	it('should respond with 404 if GET is not implemented', async () => {
		const res = await fixture.fetch('/incorrect-route', { method: 'HEAD' });
		assert.equal(res.status, 404);
	});

	it('should respond with same code as GET response', async () => {
		const res = await fixture.fetch('/incorrect', { method: 'HEAD' });
		assert.equal(res.status, 500);
	});

	it('should remove body and pass headers for HEAD requests', async () => {
		const res = await fixture.fetch('/headers', { method: 'HEAD' });
		assert.equal(res.status, 201);
		assert.equal(res.headers.get('test'), 'value');
		const body = await res.text();
		assert.equal(body, '');
	});
});
