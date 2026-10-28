import * as assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

function fetchWithHost(port: number, hostHeader: string): Promise<http.IncomingMessage> {
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
	let fixture: Fixture;
	let previewServer: PreviewServer;
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
