import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isRemoteAllowed,
	matchHostname,
	matchPathname,
	matchPattern,
	matchPort,
	matchProtocol,
} from '@astrojs/internal-helpers/remote';

describe('remote-pattern', () => {
	const url1 = new URL('https://docs.astro.build/en/getting-started');
	const url2 = new URL('http://preview.docs.astro.build:8080/');
	const url3 = new URL('https://astro.build/');
	const url4 = new URL('https://example.co/');
	const url5 = new URL('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==');

	describe('remote pattern matchers', () => {
		it('matches protocol', async () => {
			// undefined
			assert.equal(matchProtocol(url1), true);

			// defined, true/false
			assert.equal(matchProtocol(url1, 'http'), false);
			assert.equal(matchProtocol(url1, 'https'), true);
			assert.equal(matchProtocol(url5, 'data'), true);
		});

		it('matches port', async () => {
			// undefined
			assert.equal(matchPort(url1), true);

			// defined, but port is empty (default port used in URL)
			assert.equal(matchPort(url1, ''), true);

			// defined and port is custom
			assert.equal(matchPort(url2, '8080'), true);
		});

		it('matches hostname (no wildcards)', async () => {
			// undefined
			assert.equal(matchHostname(url1), true);

			// defined, true/false
			assert.equal(matchHostname(url1, 'astro.build'), false);
			assert.equal(matchHostname(url1, 'docs.astro.build'), true);
		});

		it('matches hostname (with wildcards)', async () => {
			// defined, true/false
			assert.equal(matchHostname(url1, 'docs.astro.build', true), true);
			assert.equal(matchHostname(url1, '**.astro.build', true), true);
			assert.equal(matchHostname(url1, '*.astro.build', true), true);

			assert.equal(matchHostname(url2, '*.astro.build', true), false);
			assert.equal(matchHostname(url2, '**.astro.build', true), true);

			assert.equal(matchHostname(url3, 'astro.build', true), true);
			assert.equal(matchHostname(url3, '*.astro.build', true), false);
			assert.equal(matchHostname(url3, '**.astro.build', true), false);
		});

		it('rejects hostname without dots when using single wildcard (*.domain.com)', async () => {
			// hostnames without dots (like localhost) should not match *.astro.build
			const localhostUrl = new URL('http://localhost/');
			assert.equal(matchHostname(localhostUrl, '*.astro.build', true), false);

			const bareHostnameUrl = new URL('http://example/');
			assert.equal(matchHostname(bareHostnameUrl, '*.victim.com', true), false);

			const internalUrl = new URL('http://internal/');
			assert.equal(matchHostname(internalUrl, '*.astro.build', true), false);
		});

		it('matches pathname (no wildcards)', async () => {
			// undefined
			assert.equal(matchPathname(url1), true);

			// defined, true/false
			assert.equal(matchPathname(url1, '/'), false);
			assert.equal(matchPathname(url1, '/en/getting-started'), true);
		});

		it('matches pathname (with wildcards)', async () => {
			// defined, true/false
			assert.equal(matchPathname(url1, '/en/**', true), true);
			assert.equal(matchPathname(url1, '/en/*', true), true);
			assert.equal(matchPathname(url1, '/**', true), true);

			assert.equal(matchPathname(url2, '/**', true), false);
			assert.equal(matchPathname(url2, '/*', true), false);
		});

		it('does not match pathname when prefix appears mid-path', async () => {
			// /en/* should NOT match /evil/en/getting-started
			const evilUrl = new URL('https://docs.astro.build/evil/en/getting-started');
			assert.equal(matchPathname(evilUrl, '/en/*', true), false);
		});

		it('matches patterns', async () => {
			assert.equal(matchPattern(url1, {}), true);

			assert.equal(
				matchPattern(url1, {
					protocol: 'https',
				}),
				true,
			);

			assert.equal(
				matchPattern(url1, {
					protocol: 'https',
					hostname: '**.astro.build',
				}),
				true,
			);

			assert.equal(
				matchPattern(url1, {
					protocol: 'https',
					hostname: '**.astro.build',
					pathname: '/en/**',
				}),
				true,
			);

			assert.equal(
				matchPattern(url4, {
					protocol: 'https',
					hostname: 'example.com',
				}),
				false,
			);

			assert.equal(
				matchPattern(url5, {
					protocol: 'data',
				}),
				true,
			);
		});
	});

	describe('remote is allowed', () => {
		it('allows remote URLs based on patterns', async () => {
			const patterns = {
				domains: [] as string[],
				remotePatterns: [
					{
						protocol: 'https' as const,
						hostname: '**.astro.build',
						pathname: '/en/**',
					},
					{
						protocol: 'http' as const,
						hostname: 'preview.docs.astro.build',
						port: '8080',
					},
				],
			};

			assert.equal(isRemoteAllowed(url1.href, patterns), true);
			assert.equal(isRemoteAllowed(url2.href, patterns), true);
			assert.equal(isRemoteAllowed(url3.href, patterns), false);
			assert.equal(isRemoteAllowed(url4.href, patterns), false);
			assert.equal(isRemoteAllowed(url5.href, patterns), false);
		});
	});
});
