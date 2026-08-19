import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { remotePatternToRegex } from '@astrojs/netlify';
import imageService from '../../dist/image-service.js';
import { loadFixture, SpyLogger } from '../test-utils.ts';
import type { ImageTransform } from 'astro';

async function getURL(options: ImageTransform) {
	return await imageService.getURL(
		options,
		// @ts-expect-error The second argument is not used in the current
		// implementation of `imageService.getURL`, but we need to pass it
		// to satisfy the type signature.
		{},
	);
}

describe('Image CDN', { timeout: 120000 }, () => {
	const root = new URL('./fixtures/middleware/', import.meta.url);

	describe('configuration', () => {
		after(() => {
			delete process.env.DISABLE_IMAGE_CDN;
		});

		it('enables Netlify Image CDN', async () => {
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			assert.equal(astronautPage.includes(`src="/.netlify/image`), true);
		});

		it('respects image CDN opt-out', async () => {
			process.env.DISABLE_IMAGE_CDN = 'true';
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			assert.equal(astronautPage.includes(`src="/_astro/astronaut.`), true);
		});
	});

	describe('remote image config', () => {
		let regexes: RegExp[];

		before(async () => {
			const fixture = await loadFixture({ root });
			await fixture.build();

			const config = await fixture.readFile('../.netlify/v1/config.json');
			if (config) {
				regexes = JSON.parse(config).images.remote_images.map(
					(pattern: string) => new RegExp(pattern),
				);
			}
		});

		it('generates remote image config patterns', async () => {
			assert.equal(regexes?.length, 3);
		});

		it('generates correct config for domains', async () => {
			const domain = regexes[0]!;
			assert.equal(domain.test('https://example.net/image.jpg'), true);
			assert.equal(
				domain.test('https://www.example.net/image.jpg'),
				false,
				'subdomain should not match',
			);
			assert.equal(domain.test('http://example.net/image.jpg'), true, 'http should match');
			assert.equal(
				domain.test('https://example.net/subdomain/image.jpg'),
				true,
				'subpath should match',
			);
			const subdomain = regexes[1]!;
			assert.equal(
				subdomain.test('https://secret.example.edu/image.jpg'),
				true,
				'should match subdomains',
			);
			assert.equal(
				subdomain.test('https://secretxexample.edu/image.jpg'),
				false,
				'should not use dots in domains as wildcards',
			);
		});

		it('generates correct config for remotePatterns', async () => {
			const patterns = regexes[2]!;
			assert.equal(
				patterns.test('https://example.org/images/1.jpg'),
				false,
				'apex hostname should not match for *.example.org',
			);
			assert.equal(
				patterns.test('https://www.example.org/images/2.jpg'),
				true,
				'www subdomain should match',
			);
			assert.equal(
				patterns.test('https://www.subdomain.example.org/images/2.jpg'),
				false,
				'second level subdomain should not match',
			);
			assert.equal(
				patterns.test('https://example.org/not-images/2.jpg'),
				false,
				'wrong path should not match',
			);
			assert.equal(
				patterns.test('https://www.example.org/images/a/b.jpg'),
				false,
				'deeper path should not match for /images/*',
			);
		});

		it('treats metacharacters in a literal pathname as literals', async () => {
			const spyLogger = new SpyLogger();
			const logger = spyLogger.forkIntegrationLogger('test-spy');
			const regexStr = remotePatternToRegex(
				{
					protocol: 'https',
					hostname: 'cdn.example.com',
					pathname: '/img/v1.0/file',
				},
				logger,
			);
			const regex = new RegExp(regexStr!);
			assert.equal(
				regex.test('https://cdn.example.com/img/v1.0/file'),
				true,
				'literal pathname should match',
			);
			assert.equal(
				regex.test('https://cdn.example.com/img/v1X0/file'),
				false,
				'dot in pathname should not act as a wildcard',
			);
			assert.equal(
				regex.test('https://cdn.example.com/img/v1/0/file'),
				false,
				'dot in pathname should not match a path separator',
			);
		});

		it('treats metacharacters in a wildcard pathname prefix as literals', async () => {
			const spyLogger = new SpyLogger();
			const logger = spyLogger.forkIntegrationLogger('test-spy');
			const oneLevel = new RegExp(
				remotePatternToRegex(
					{ protocol: 'https', hostname: 'cdn.example.com', pathname: '/v1.0/*' },
					logger,
				)!,
			);
			assert.equal(oneLevel.test('https://cdn.example.com/v1.0/file'), true);
			assert.equal(
				oneLevel.test('https://cdn.example.com/v1X0/file'),
				false,
				'dot in wildcard prefix should not act as a wildcard',
			);

			const anyPath = new RegExp(
				remotePatternToRegex(
					{ protocol: 'https', hostname: 'cdn.example.com', pathname: '/v1.0/**' },
					logger,
				)!,
			);
			assert.equal(anyPath.test('https://cdn.example.com/v1.0/a/b'), true);
			assert.equal(
				anyPath.test('https://cdn.example.com/v1X0/a/b'),
				false,
				'dot in wildcard prefix should not act as a wildcard',
			);
		});

		it('treats metacharacters in the hostname as literals', async () => {
			const spyLogger = new SpyLogger();
			const logger = spyLogger.forkIntegrationLogger('test-spy');
			const regex = new RegExp(
				remotePatternToRegex(
					{ protocol: 'https', hostname: 'a+b.example.com', pathname: '/img.png' },
					logger,
				)!,
			);
			assert.equal(
				regex.test('https://a+b.example.com/img.png'),
				true,
				'literal hostname should match',
			);
			assert.equal(
				regex.test('https://aaab.example.com/img.png'),
				false,
				'a metacharacter in the hostname should not act as a quantifier',
			);
		});
	});

	describe('fit parameter', () => {
		it('includes fit parameter in image URL', async () => {
			const url = await getURL({
				src: 'images/astronaut.jpg',
				width: 300,
				height: 400,
				fit: 'cover',
				format: 'webp',
			});
			assert.ok(url.includes('fit=cover'), `Expected fit=cover in URL, got: ${url}`);
		});

		it('maps Astro fit values to Netlify equivalents', async () => {
			const cases = [
				['contain', 'contain'],
				['cover', 'cover'],
				['fill', 'fill'],
				['inside', 'contain'],
				['outside', 'cover'],
				['scale-down', 'contain'],
			];
			for (const [astroFit, netlifyFit] of cases) {
				const url = await getURL({
					src: 'img.jpg',
					width: 100,
					height: 100,
					fit: astroFit,
				});
				assert.ok(
					url.includes(`fit=${netlifyFit}`),
					`Expected fit=${netlifyFit} for astro fit="${astroFit}", got: ${url}`,
				);
			}
		});

		it('omits fit parameter when fit is none or unset', async () => {
			const withNone = await getURL({
				src: 'img.jpg',
				width: 100,
				height: 100,
				fit: 'none',
			});
			assert.ok(
				!withNone.includes('fit='),
				`Expected no fit param for fit="none", got: ${withNone}`,
			);

			const withoutFit = await getURL({ src: 'img.jpg', width: 100, height: 100 });
			assert.ok(
				!withoutFit.includes('fit='),
				`Expected no fit param when unset, got: ${withoutFit}`,
			);
		});
	});
});
