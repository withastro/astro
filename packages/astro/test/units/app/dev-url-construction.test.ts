import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SSRManifest } from '../../../dist/core/app/types.js';
import {
	getFirstForwardedValue,
	validateForwardedHeaders,
} from '../../../dist/core/app/validate-headers.js';

function buildDevUrl({
	headers,
	isHttps = false,
	allowedDomains,
	requestUrl = '/',
}: {
	headers: Record<string, string>;
	isHttps?: boolean;
	allowedDomains?: SSRManifest['allowedDomains'];
	requestUrl?: string;
}): URL {
	const validated = validateForwardedHeaders(
		getFirstForwardedValue(headers['x-forwarded-proto']),
		getFirstForwardedValue(headers['x-forwarded-host']),
		getFirstForwardedValue(headers['x-forwarded-port']),
		allowedDomains,
	);

	const protocol = validated.protocol ?? (isHttps ? 'https' : 'http');
	const host = validated.host ?? headers[':authority'] ?? headers['host'];

	return new URL(`${protocol}://${host}${requestUrl}`);
}

describe('Dev server URL construction — X-Forwarded-Proto handling', () => {
	it('uses http when isHttps=false and no allowedDomains configured (default)', () => {
		const url = buildDevUrl({
			headers: { host: 'localhost:4321' },
			isHttps: false,
		});
		assert.equal(url.protocol, 'http:');
		assert.equal(url.origin, 'http://localhost:4321');
	});

	it('ignores X-Forwarded-Proto when allowedDomains is not configured', () => {
		// Without allowedDomains the header must not be trusted — this is the
		// security guard that prevents an attacker from forcing the scheme used
		// in CSRF origin comparisons.
		const url = buildDevUrl({
			headers: { host: 'localhost:4321', 'x-forwarded-proto': 'https' },
			isHttps: false,
		});
		assert.equal(url.protocol, 'http:');
		assert.equal(url.origin, 'http://localhost:4321');
	});

	it('ignores X-Forwarded-Proto when allowedDomains is an empty array', () => {
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'https' },
			isHttps: false,
			allowedDomains: [],
		});
		assert.equal(url.protocol, 'http:');
	});

	it('uses https from X-Forwarded-Proto when allowedDomains matches hostname', () => {
		// Behind a TLS-terminating proxy (Caddy, nginx, Traefik) the browser
		// sends Origin: https://host while the proxy connects to Vite over HTTP.
		// With allowedDomains configured, the dev server derives the same
		// https:// origin, so the CSRF Origin === url.origin comparison passes.
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'https' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		assert.equal(url.protocol, 'https:');
		assert.equal(url.origin, 'https://mre.local');
	});

	it('uses https from X-Forwarded-Proto with wildcard hostname pattern', () => {
		const url = buildDevUrl({
			headers: { host: 'app.example.com', 'x-forwarded-proto': 'https' },
			isHttps: false,
			allowedDomains: [{ protocol: 'https', hostname: '**.example.com' }],
		});
		assert.equal(url.protocol, 'https:');
		assert.equal(url.origin, 'https://app.example.com');
	});

	it('trusts X-Forwarded-Proto even when host does not match allowedDomains pattern', () => {
		// validateForwardedHeaders validates protocol and host independently.
		// When allowedDomains is non-empty but has no `protocol` property,
		// any http/https value is accepted for the protocol. The host match is
		// only required for the X-Forwarded-Host to be trusted; the fallback
		// host header is used instead. This mirrors production (node.ts) behaviour.
		const url = buildDevUrl({
			headers: { host: 'localhost:4321', 'x-forwarded-proto': 'https' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		// Protocol is trusted (allowedDomains is non-empty); host falls back to
		// the Host header value.
		assert.equal(url.protocol, 'https:');
		assert.equal(url.origin, 'https://localhost:4321');
	});

	it('rejects X-Forwarded-Proto that does not match explicit protocol in allowedDomains', () => {
		// When allowedDomains specifies a protocol, only that protocol is allowed.
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'http' },
			isHttps: false,
			allowedDomains: [{ protocol: 'https', hostname: 'mre.local' }],
		});
		// 'http' is rejected because the pattern requires 'https'
		assert.equal(url.protocol, 'http:');
	});

	it('falls back to isHttps=true when X-Forwarded-Proto is absent but Vite uses TLS', () => {
		// When the user configures Vite's own TLS (vite.server.https) without a
		// proxy, isHttps=true should still work.
		const url = buildDevUrl({
			headers: { host: 'localhost:4321' },
			isHttps: true,
		});
		assert.equal(url.protocol, 'https:');
	});

	it('uses first value from comma-separated X-Forwarded-Proto', () => {
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'https,http' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		assert.equal(url.protocol, 'https:');
	});

	it('uses first value from comma-separated X-Forwarded-Proto with spaces', () => {
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': ' https , http' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		assert.equal(url.protocol, 'https:');
	});

	it('rejects malicious X-Forwarded-Proto with URL injection', () => {
		const url = buildDevUrl({
			headers: {
				host: 'mre.local',
				'x-forwarded-proto': 'https://evil.com/?x=',
			},
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		// validateForwardedHeaders rejects invalid protocol values
		assert.equal(url.protocol, 'http:');
	});

	it('rejects javascript: scheme injection in X-Forwarded-Proto', () => {
		const url = buildDevUrl({
			headers: {
				host: 'mre.local',
				'x-forwarded-proto': 'javascript:alert(1)//',
			},
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		assert.equal(url.protocol, 'http:');
	});

	it('rejects empty X-Forwarded-Proto and falls back to isHttps', () => {
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': '' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		assert.equal(url.protocol, 'http:');
	});

	it('produces an origin that matches the browser Origin header when proxy is configured', () => {
		// The CSRF check compares request.headers.origin === url.origin.
		// When the dev server runs behind a TLS-terminating proxy and
		// allowedDomains is configured, both sides of that comparison must
		// resolve to the same https:// origin.
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'https' },
			isHttps: false,
			allowedDomains: [{ hostname: 'mre.local' }],
		});
		const browserOriginHeader = 'https://mre.local';
		assert.equal(url.origin, browserOriginHeader);
	});

	it('produces a mismatched origin behind a proxy when allowedDomains is not configured', () => {
		// Without allowedDomains, X-Forwarded-Proto is untrusted and the URL
		// gets an http:// origin while the browser sends Origin: https://.
		// The CSRF check (Origin === url.origin) therefore returns false and
		// blocks the request with 403.
		const url = buildDevUrl({
			headers: { host: 'mre.local', 'x-forwarded-proto': 'https' },
			isHttps: false,
			// no allowedDomains
		});
		const browserOriginHeader = 'https://mre.local';
		assert.notEqual(url.origin, browserOriginHeader); // http:// vs https://
	});
});
