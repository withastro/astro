import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computePathnameFromDomain } from '../../../dist/core/i18n/domain.js';
import type { SSRManifestI18n } from '../../../dist/core/app/types.js';
import type { RoutingStrategies } from '../../../dist/core/app/common.js';
import type { Locales } from '../../../dist/types/public/config.js';
import { defaultLogger, SpyLogger } from '../test-utils.ts';

interface I18nOverrides {
	strategy?: RoutingStrategies;
	locales?: Locales;
	defaultLocale?: string;
	domainLookupTable?: Record<string, string>;
}

function makeI18n(overrides: I18nOverrides = {}): SSRManifestI18n {
	return {
		fallback: undefined,
		fallbackType: 'rewrite',
		strategy: overrides.strategy ?? 'domains-prefix-other-locales',
		locales: overrides.locales ?? (['en', 'fr'] as Locales),
		defaultLocale: overrides.defaultLocale ?? 'en',
		domainLookupTable: overrides.domainLookupTable ?? { 'https://example.fr': 'fr' },
		domains: undefined,
	};
}

/** Builds a request + parsed URL pair, the two positional args the fn takes. */
function reqAndUrl(url: string, headers: Record<string, string> = {}) {
	const request = new Request(url, { headers });
	return [request, new URL(request.url)] as const;
}

function run(
	url: string,
	headers: Record<string, string>,
	opts: {
		i18n?: SSRManifestI18n | undefined;
		base?: string;
		trailingSlash?: 'always' | 'never' | 'ignore';
		logger?: typeof defaultLogger;
	} = {},
) {
	// Resolve i18n via key presence so an explicit `i18n: undefined` is honored
	// (a destructuring default would replace it with the configured fallback).
	const i18n = 'i18n' in opts ? opts.i18n : makeI18n();
	const base = opts.base ?? '/';
	const trailingSlash = opts.trailingSlash ?? 'ignore';
	const logger = opts.logger ?? defaultLogger;
	const [request, parsedUrl] = reqAndUrl(url, headers);
	return computePathnameFromDomain(request, parsedUrl, i18n, base, trailingSlash, logger);
}

describe('computePathnameFromDomain', () => {
	it('returns undefined when i18n is not configured', () => {
		assert.equal(
			run('https://example.fr/about', { 'X-Forwarded-Host': 'example.fr' }, { i18n: undefined }),
			undefined,
		);
	});

	it('returns undefined for non domain-based strategies', () => {
		const i18n = makeI18n({ strategy: 'pathname-prefix-other-locales' });
		assert.equal(
			run('https://example.fr/about', { 'X-Forwarded-Host': 'example.fr' }, { i18n }),
			undefined,
		);
	});

	it('returns undefined when the host is not mapped to a locale', () => {
		assert.equal(
			run('https://example.com/about', { 'X-Forwarded-Host': 'example.com' }),
			undefined,
		);
	});

	it('returns undefined when neither Host nor X-Forwarded-Host is present', () => {
		// `new Request` always derives a Host from the URL, so build a request
		// whose URL host is unmapped and pass no forwarding headers.
		assert.equal(run('https://example.com/about', {}), undefined);
	});

	it('prepends the locale prefix derived from X-Forwarded-Host', () => {
		assert.equal(
			run('https://example.fr/about', {
				'X-Forwarded-Host': 'example.fr',
				'X-Forwarded-Proto': 'https',
			}),
			'/fr/about',
		);
	});

	it('falls back to the Host header when X-Forwarded-Host is absent', () => {
		assert.equal(run('https://example.fr/about', { Host: 'example.fr' }), '/fr/about');
	});

	it('strips a port from the forwarded host before matching', () => {
		assert.equal(
			run('https://example.fr/about', {
				'X-Forwarded-Host': 'example.fr:8443',
				'X-Forwarded-Proto': 'https',
			}),
			'/fr/about',
		);
	});

	it('returns undefined on protocol mismatch with the mapped domain', () => {
		// domainLookupTable maps https://example.fr; an http request must not match.
		assert.equal(
			run('http://example.fr/about', {
				'X-Forwarded-Host': 'example.fr',
				'X-Forwarded-Proto': 'http',
			}),
			undefined,
		);
	});

	it('appends a trailing slash when trailingSlash is "always"', () => {
		assert.equal(
			run(
				'https://example.fr/about',
				{ 'X-Forwarded-Host': 'example.fr' },
				{ trailingSlash: 'always' },
			),
			'/fr/about/',
		);
	});

	it('removes the trailing slash when trailingSlash is "never"', () => {
		assert.equal(
			run(
				'https://example.fr/about/',
				{ 'X-Forwarded-Host': 'example.fr' },
				{ trailingSlash: 'never' },
			),
			'/fr/about',
		);
	});

	it('preserves the request trailing slash when trailingSlash is "ignore"', () => {
		assert.equal(
			run(
				'https://example.fr/about/',
				{ 'X-Forwarded-Host': 'example.fr' },
				{ trailingSlash: 'ignore' },
			),
			'/fr/about/',
		);
		assert.equal(
			run(
				'https://example.fr/about',
				{ 'X-Forwarded-Host': 'example.fr' },
				{ trailingSlash: 'ignore' },
			),
			'/fr/about',
		);
	});

	it('strips the configured base before prepending the locale', () => {
		assert.equal(
			run('https://example.fr/shop/about', { 'X-Forwarded-Host': 'example.fr' }, { base: '/shop' }),
			'/fr/about',
		);
	});

	it('returns the locale-prefixed pathname without decoding (encoding preserved)', () => {
		assert.equal(
			run('https://example.fr/caf%C3%A9', { 'X-Forwarded-Host': 'example.fr' }),
			'/fr/caf%C3%A9',
		);
	});

	it('works for the domains-prefix-always strategy', () => {
		const i18n = makeI18n({ strategy: 'domains-prefix-always' });
		assert.equal(
			run('https://example.fr/about', { 'X-Forwarded-Host': 'example.fr' }, { i18n }),
			'/fr/about',
		);
	});

	it('works for the domains-prefix-always-no-redirect strategy', () => {
		const i18n = makeI18n({ strategy: 'domains-prefix-always-no-redirect' });
		assert.equal(
			run('https://example.fr/about', { 'X-Forwarded-Host': 'example.fr' }, { i18n }),
			'/fr/about',
		);
	});

	it('logs an error and returns undefined when the host cannot be parsed as a URL', () => {
		const logger = new SpyLogger();
		const result = run('https://example.fr/about', { 'X-Forwarded-Host': '[' }, { logger });
		assert.equal(result, undefined);
		assert.ok(
			logger.logs.some((entry) => entry.level === 'error' && entry.label === 'router'),
			'expected a router error to be logged',
		);
	});
});
