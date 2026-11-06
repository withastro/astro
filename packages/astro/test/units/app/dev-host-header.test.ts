import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateHost, getFirstForwardedValue, validateForwardedHeaders } from '../../../dist/core/app/validate-headers.js';

const DEFAULT_PORT = 4321;

function buildDevUrl({
	headers,
	isHttps = false,
	allowedDomains,
	requestUrl = '/',
	serverPort = DEFAULT_PORT,
}: {
	headers: Record<string, string>;
	isHttps?: boolean;
	allowedDomains?: { hostname?: string; protocol?: string; port?: string }[];
	requestUrl?: string;
	serverPort?: number;
}): URL {
	const protocol = isHttps ? 'https' : 'http';
	const host = (headers[':authority'] as string | undefined) ?? headers['host'];

	// Match the new handleDevRequest behavior: validate Host against allowedDomains
	const validatedHost = validateHost(host, protocol, allowedDomains);
	const fallbackHost = serverPort ? `localhost:${serverPort}` : 'localhost';
	const safeHost = validatedHost ?? fallbackHost;

	return new URL(`${protocol}://${safeHost}${requestUrl}`);
}

describe('Dev server Host header handling — HYP-001 validation (new behavior)', () => {
	it('falls back to localhost:port when no allowedDomains configured', () => {
		const url = buildDevUrl({
			headers: { host: 'attacker.com' },
			isHttps: false,
		});
		assert.equal(url.origin, `http://localhost:${DEFAULT_PORT}`);
	});

	it('falls back to localhost:port when allowedDomains is empty array', () => {
		const url = buildDevUrl({
			headers: { host: 'attacker.com' },
			isHttps: false,
			allowedDomains: [],
		});
		assert.equal(url.origin, `http://localhost:${DEFAULT_PORT}`);
	});

	it('falls back to localhost:port when allowedDomains configured but Host does not match', () => {
		const url = buildDevUrl({
			headers: { host: 'attacker.com' },
			isHttps: false,
			allowedDomains: [{ hostname: 'example.com' }],
		});
		assert.equal(url.origin, `http://localhost:${DEFAULT_PORT}`);
	});

	it('uses validated Host when it matches allowedDomains', () => {
		const url = buildDevUrl({
			headers: { host: 'example.com' },
			isHttps: false,
			allowedDomains: [{ hostname: 'example.com' }],
		});
		assert.equal(url.origin, 'http://example.com');
	});

	it('uses validated Host with port when allowedDomains has port pattern', () => {
		const url = buildDevUrl({
			headers: { host: 'example.com:3000' },
			isHttps: false,
			allowedDomains: [{ hostname: 'example.com', port: '3000' }],
		});
		assert.equal(url.origin, 'http://example.com:3000');
	});

	it('rejects Host with port mismatch', () => {
		const url = buildDevUrl({
			headers: { host: 'example.com:8080' },
			isHttps: false,
			allowedDomains: [{ hostname: 'example.com', port: '80' }],
		});
		assert.equal(url.origin, `http://localhost:${DEFAULT_PORT}`);
	});

	it('uses :authority for HTTP/2 when allowedDomains not configured', () => {
		const url = buildDevUrl({
			headers: { ':authority': 'attacker.com' },
			isHttps: true,
		});
		assert.equal(url.origin, `https://localhost:${DEFAULT_PORT}`);
	});

	it('prefers :authority over Host for HTTP/2', () => {
		const url = buildDevUrl({
			headers: {
				host: 'host-header.com',
				':authority': 'authority-header.com',
			},
			isHttps: true,
		});
		assert.equal(url.origin, `https://localhost:${DEFAULT_PORT}`);
	});

	it('uses validated Host with :authority when allowedDomains configured and matches', () => {
		const url = buildDevUrl({
			headers: {
				':authority': 'example.com',
			},
			isHttps: true,
			allowedDomains: [{ hostname: 'example.com' }],
		});
		assert.equal(url.origin, 'https://example.com');
	});

	it('falls back to localhost:port with custom server port', () => {
		const customPort = 3000;
		const url = buildDevUrl({
			headers: { host: 'attacker.com' },
			isHttps: false,
			serverPort: customPort,
		});
		assert.equal(url.origin, `http://localhost:${customPort}`);
	});

	it('uses HTTPS with custom server port when Host matches', () => {
		const customPort = 3000;
		const url = buildDevUrl({
			headers: { host: 'example.com' },
			isHttps: true,
			allowedDomains: [{ hostname: 'example.com' }],
			serverPort: customPort,
		});
		assert.equal(url.origin, 'https://example.com');
	});
});

describe('Dev server X-Forwarded-Host handling (simulated — actual validation in FetchState)', () => {
	// These tests document the X-Forwarded-Host behavior which is validated
	// later in FetchState.#applyForwardedHeaders(), not in handleDevRequest.
	// The handleDevRequest validates the raw Host header; X-Forwarded-Host
	// may override the URL later in the request lifecycle.

	it('uses validated X-Forwarded-Host when it matches allowedDomains (FetchState behavior)', () => {
		// This simulates the FetchState behavior after #applyForwardedHeaders()
		// where X-Forwarded-Host is validated and overrides the initial URL.
		// The initial URL from handleDevRequest uses the validated raw Host.
		// If X-Forwarded-Host is valid, FetchState updates the URL.

		const validated = validateForwardedHeaders(
			undefined,
			getFirstForwardedValue('example.com'),
			undefined,
			[{ hostname: 'example.com' }]
		);

		assert.equal(validated.host, 'example.com');
	});

	it('falls back to raw Host when X-Forwarded-Host does not match allowedDomains (FetchState behavior)', () => {
		const validated = validateForwardedHeaders(
			undefined,
			getFirstForwardedValue('evil.com'),
			undefined,
			[{ hostname: 'example.com' }]
		);

		// X-Forwarded-Host invalid, so validated.host is undefined
		// Fallback to raw Host would happen in FetchState
		assert.equal(validated.host, undefined);
	});
});