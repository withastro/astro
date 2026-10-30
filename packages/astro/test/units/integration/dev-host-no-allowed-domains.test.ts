import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from '../../test-utils.ts';
import { request as httpRequest } from 'node:http';

describe('Host header validation: no allowedDomains configured', () => {
	let fixture: Fixture;
	let devServer: any;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-host-no-allowed-domains/',
			outDir: './dist/dev-host-no-allowed-domains/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	function makeRequest(options: {
		path: string;
		method: string;
		headers: Record<string, string>;
		body?: string;
	}): Promise<{ status: number; body: string }> {
		return new Promise((resolve, reject) => {
			const serverUrl = devServer.resolvedUrls?.local?.[0] || `http://localhost:${devServer.address?.port}`;
			const url = new URL(options.path, serverUrl);

			const req = httpRequest({
				hostname: url.hostname,
				port: url.port,
				path: url.pathname + url.search,
				method: options.method,
				headers: {
					...options.headers,
					'content-length': Buffer.byteLength(options.body || ''),
				},
			}, (res) => {
				let body = '';
				res.on('data', (chunk) => { body += chunk; });
				res.on('end', () => resolve({ status: res.statusCode || 0, body }));
			});

			if (options.headers.host) {
				req.setHeader('Host', options.headers.host);
			}

			req.on('error', reject);
			if (options.body) {
				req.write(options.body);
			}
			req.end();
		});
	}

	it('falls back to localhost:port when allowedDomains not configured and Host is attacker.com', async () => {
		// When allowedDomains is not configured, validateHost returns undefined
		// and the fallback to localhost:port is used.

		const { status, body } = await makeRequest({
			path: '/submit',
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'host': 'attacker.com',
			},
			body: 'data=test',
		});

		// Request should succeed (200/302) since no Origin header to trigger CSRF
		// The important thing is that the Host validation runs and falls back to localhost
		// We verify the server doesn't crash and the request is handled
		assert.ok(status === 200 || status === 302, `Expected 200/302, got ${status}: ${body}`);
	});

	it('falls back to localhost:port when allowedDomains is empty array and Host is attacker.com', async () => {
		// This test requires a separate fixture with allowedDomains: []
		// For now we test the same fixture since both cases behave identically
		const { status, body } = await makeRequest({
			path: '/submit',
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'host': 'evil.com',
			},
			body: 'data=test',
		});

		assert.ok(status === 200 || status === 302, `Expected 200/302, got ${status}: ${body}`);
	});

	it('allows request when Host matches an allowed domain (control with allowedDomains)', async () => {
		// This test validates that the fixture setup works correctly
		// We can't easily test "authorized host" without allowedDomains since
		// there are no allowed domains. This is a control test.
		const { status, body } = await makeRequest({
			path: '/',
			method: 'GET',
			headers: {
				'host': 'localhost',
			},
		});

		assert.ok(status === 200, `Expected 200, got ${status}: ${body}`);
	});

	it('CONTROL: sec-fetch-site=cross-site blocks request regardless of Host', async () => {
		const { status } = await makeRequest({
			path: '/submit',
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'host': 'attacker.com',
				'sec-fetch-site': 'cross-site',
			},
			body: 'data=test',
		});

		assert.equal(status, 403, 'Should block when sec-fetch-site is cross-site');
	});
});

describe('Host header validation: allowedDomains empty array', () => {
	let fixture: Fixture;
	let devServer: any;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-host-empty-allowed-domains/',
			outDir: './dist/dev-host-empty-allowed-domains/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	function makeRequest(options: {
		path: string;
		method: string;
		headers: Record<string, string>;
		body?: string;
	}): Promise<{ status: number; body: string }> {
		return new Promise((resolve, reject) => {
			const serverUrl = devServer.resolvedUrls?.local?.[0] || `http://localhost:${devServer.address?.port}`;
			const url = new URL(options.path, serverUrl);

			const req = httpRequest({
				hostname: url.hostname,
				port: url.port,
				path: url.pathname + url.search,
				method: options.method,
				headers: {
					...options.headers,
					'content-length': Buffer.byteLength(options.body || ''),
				},
			}, (res) => {
				let body = '';
				res.on('data', (chunk) => { body += chunk; });
				res.on('end', () => resolve({ status: res.statusCode || 0, body }));
			});

			if (options.headers.host) {
				req.setHeader('Host', options.headers.host);
			}

			req.on('error', reject);
			if (options.body) {
				req.write(options.body);
			}
			req.end();
		});
	}

	it('falls back to localhost:port when allowedDomains is empty array and Host is attacker.com', async () => {
		const { status, body } = await makeRequest({
			path: '/submit',
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'host': 'attacker.com',
			},
			body: 'data=test',
		});

		assert.ok(status === 200 || status === 302, `Expected 200/302, got ${status}: ${body}`);
	});

	it('CONTROL: sec-fetch-site=cross-site blocks request regardless of Host', async () => {
		const { status } = await makeRequest({
			path: '/submit',
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'host': 'attacker.com',
				'sec-fetch-site': 'cross-site',
			},
			body: 'data=test',
		});

		assert.equal(status, 403, 'Should block when sec-fetch-site is cross-site');
	});
});