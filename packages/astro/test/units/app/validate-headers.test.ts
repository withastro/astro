import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateForwardedHeaders, validateHost } from '../../../dist/core/app/validate-headers.js';

type AllowedDomains = Parameters<typeof validateForwardedHeaders>[3];

function validate(
	allowedDomains: AllowedDomains,
	forwarded: { protocol?: string; host?: string; port?: string },
	fallback: { protocol: string; host?: string },
) {
	return validateForwardedHeaders(
		forwarded.protocol,
		forwarded.host,
		forwarded.port,
		allowedDomains,
		fallback,
	);
}

const MIXED = [{ hostname: 'domain1.com', protocol: 'https' }, { hostname: 'domain2.com' }];

describe('validateForwardedHeaders', () => {
	describe('protocol is validated for the host in use', () => {
		it('rejects a protocol that the entry for the request host does not allow', () => {
			const result = validate(
				MIXED,
				{ protocol: 'http' },
				{ protocol: 'https', host: 'domain1.com' },
			);
			assert.deepEqual(result, {});
		});

		it('accepts a protocol that the entry for the request host allows', () => {
			assert.deepEqual(
				validate(MIXED, { protocol: 'https' }, { protocol: 'http', host: 'domain1.com' }),
				{ protocol: 'https' },
			);
			assert.deepEqual(
				validate(MIXED, { protocol: 'http' }, { protocol: 'https', host: 'domain2.com' }),
				{ protocol: 'http' },
			);
		});

		it('does not trust the protocol when the request host matches no entry', () => {
			const result = validate(
				MIXED,
				{ protocol: 'https' },
				{ protocol: 'http', host: 'internal:4321' },
			);
			assert.deepEqual(result, {});
		});

		it('validates the protocol together with a forwarded host', () => {
			const fallback = { protocol: 'http', host: 'internal:4321' };
			assert.deepEqual(validate(MIXED, { protocol: 'http', host: 'domain1.com' }, fallback), {});
			assert.deepEqual(validate(MIXED, { protocol: 'https', host: 'domain1.com' }, fallback), {
				protocol: 'https',
				host: 'domain1.com',
			});
			assert.deepEqual(validate(MIXED, { protocol: 'http', host: 'domain2.com' }, fallback), {
				protocol: 'http',
				host: 'domain2.com',
			});
		});

		it('only allows http and https for an entry without a protocol', () => {
			for (const protocol of ['ftp', 'ws', 'wss', 'file']) {
				assert.deepEqual(
					validate(MIXED, { protocol }, { protocol: 'http', host: 'domain2.com' }),
					{},
					protocol,
				);
			}
		});

		it('allows exactly the protocol of an entry that sets one', () => {
			const allowed = [{ hostname: 'domain1.com', protocol: 'wss' }];
			const fallback = { protocol: 'http', host: 'internal' };
			assert.deepEqual(validate(allowed, { protocol: 'wss', host: 'domain1.com' }, fallback), {
				protocol: 'wss',
				host: 'domain1.com',
			});
			assert.deepEqual(validate(allowed, { protocol: 'https', host: 'domain1.com' }, fallback), {});
		});
	});

	describe('forwarded host without a trusted protocol', () => {
		const HTTPS_ONLY = [{ hostname: 'domain1.com', protocol: 'https' }];

		it('validates the forwarded host with the server protocol, not https', () => {
			const fallback = { protocol: 'http', host: 'internal:4321' };
			assert.deepEqual(validate(HTTPS_ONLY, { host: 'domain1.com' }, fallback), {});
			assert.deepEqual(
				validate(HTTPS_ONLY, { protocol: 'bogus', host: 'domain1.com' }, fallback),
				{},
			);
		});

		it('accepts the forwarded host when the server protocol is allowed', () => {
			assert.deepEqual(
				validate(HTTPS_ONLY, { host: 'domain1.com' }, { protocol: 'https', host: 'internal' }),
				{ host: 'domain1.com' },
			);
		});
	});

	describe('ports', () => {
		const PORTS = [
			{ hostname: 'a.com', protocol: 'https' },
			{ hostname: 'b.com', port: '8443' },
		];

		it('only accepts X-Forwarded-Port when the entry for the host lists it', () => {
			assert.deepEqual(
				validate(PORTS, { protocol: 'https', port: '8443' }, { protocol: 'http', host: 'a.com' }),
				{ protocol: 'https' },
			);
			assert.deepEqual(
				validate(PORTS, { host: 'a.com', protocol: 'https', port: '8443' }, { protocol: 'http' }),
				{ protocol: 'https', host: 'a.com' },
			);
			assert.deepEqual(
				validate(PORTS, { host: 'b.com', port: '8443' }, { protocol: 'http', host: 'x' }),
				{ host: 'b.com', port: '8443' },
			);
		});

		it('ignores X-Forwarded-Port when no entry lists a port', () => {
			assert.deepEqual(
				validate([{ hostname: 'a.com' }], { host: 'a.com', port: '8080' }, { protocol: 'http' }),
				{ host: 'a.com' },
			);
		});

		it('matches an entry with a default port against a host without a port', () => {
			const allowed = [{ hostname: 'staging.myapp.com', protocol: 'https', port: '443' }];
			const fallback = { protocol: 'http', host: 'internal' };
			for (const host of ['staging.myapp.com', 'staging.myapp.com:443']) {
				assert.deepEqual(validate(allowed, { protocol: 'https', host }, fallback), {
					protocol: 'https',
					host,
				});
			}
			assert.deepEqual(
				validate(allowed, { protocol: 'https', host: 'staging.myapp.com:8443' }, fallback),
				{},
			);
		});

		it('accepts any port in the host for an entry without a port', () => {
			assert.deepEqual(
				validate([{ hostname: 'a.com' }], { host: 'a.com:8080' }, { protocol: 'http' }),
				{ host: 'a.com:8080' },
			);
		});
	});

	describe('allow-all entries', () => {
		it('allows any host with http or https for [{}]', () => {
			const fallback = { protocol: 'http', host: 'localhost' };
			assert.deepEqual(validate([{}], { protocol: 'https', host: 'anything.test' }, fallback), {
				protocol: 'https',
				host: 'anything.test',
			});
			assert.deepEqual(validate([{}], { protocol: 'ftp' }, fallback), {});
		});

		it('allows any host with the protocol of a protocol-only entry', () => {
			assert.deepEqual(
				validate(
					[{ protocol: 'https' }],
					{ protocol: 'https', host: 'x.test' },
					{ protocol: 'http', host: 'localhost' },
				),
				{ protocol: 'https', host: 'x.test' },
			);
		});
	});

	it('trusts nothing when allowedDomains is empty', () => {
		assert.deepEqual(
			validate(
				[],
				{ protocol: 'https', host: 'a.com', port: '443' },
				{ protocol: 'http', host: 'a.com' },
			),
			{},
		);
	});
});

describe('validateHost', () => {
	it('matches an entry with a default port against a host without a port', () => {
		const allowed = [{ hostname: 'staging.myapp.com', protocol: 'https', port: '443' }];
		assert.equal(validateHost('staging.myapp.com', 'https', allowed), 'staging.myapp.com');
		assert.equal(validateHost('staging.myapp.com', 'http', allowed), undefined);
	});

	it('only allows http and https for an entry without a protocol', () => {
		assert.equal(validateHost('a.com', 'https', [{ hostname: 'a.com' }]), 'a.com');
		assert.equal(validateHost('a.com', 'ftp', [{ hostname: 'a.com' }]), undefined);
	});
});
