import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('endpoints', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/endpoint-routing/',
			outDir: './dist/endpoint-runtime/',
			cacheDir: './node_modules/.astro-test/endpoint-runtime/',
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
