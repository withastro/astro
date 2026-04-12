import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import http from 'node:http';
import { loadFixture } from './_test-utils.js';

function fetchWithHost(port, hostHeader) {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: 'localhost',
				port,
				path: '/',
				method: 'GET',
				headers: { host: hostHeader },
			},
			(res) => {
				res.resume();
				resolve(res);
			},
		);
		req.on('error', reject);
		req.end();
	});
}

describe('Cloudflare allowedHosts', () => {
	let fixture;
	let previewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/allowed-hosts/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('allows requests with an allowed host', async () => {
		const res = await fetchWithHost(previewServer.port, 'test.com');
		assert.equal(res.statusCode, 200);
	});

	it('denies requests with an unknown host', async () => {
		const res = await fetchWithHost(previewServer.port, 'malicious.com');
		assert.equal(res.statusCode, 403);
	});
});
