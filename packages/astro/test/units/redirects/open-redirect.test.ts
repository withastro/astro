// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { redirectIsExternal } from '../../../dist/core/redirects/render.js';
import { getRouteGenerator } from '../../../dist/core/routing/generator.js';

describe('Protocol-relative URLs in redirects', () => {
	describe('redirectIsExternal', () => {
		it('detects http:// as external', () => {
			assert.equal(redirectIsExternal('http://evil.com'), true);
		});

		it('detects https:// as external', () => {
			assert.equal(redirectIsExternal('https://evil.com'), true);
		});

		it('detects protocol-relative //evil.com as external', () => {
			assert.equal(redirectIsExternal('//evil.com'), true);
		});

		it('detects protocol-relative //evil.com/path as external', () => {
			assert.equal(redirectIsExternal('//evil.com/path'), true);
		});

		it('does not flag normal paths as external', () => {
			assert.equal(redirectIsExternal('/about'), false);
		});

		it('does not flag root path as external', () => {
			assert.equal(redirectIsExternal('/'), false);
		});

		it('detects protocol-relative URL in object form', () => {
			assert.equal(redirectIsExternal({ destination: '//evil.com', status: 301 }), true);
		});
	});

	describe('getRouteGenerator with root-level catch-all', () => {
		it('does not produce protocol-relative URL when catch-all param contains leading slash', () => {
			// Simulates destination '/[...slug]' — a single root-level catch-all segment
			const segments = [[{ spread: true, content: '...slug', dynamic: true }]];
			const generator = getRouteGenerator(segments, 'never');

			// When the request is '/old//evil.com/', the catch-all captures '/evil.com'
			const result = generator({ slug: '/evil.com' });

			// The result must NOT be '//evil.com' (protocol-relative URL)
			assert.ok(
				!result.startsWith('//'),
				`Expected result to not start with '//', got '${result}'`,
			);
		});

		it('does not produce protocol-relative URL with trailing slash config', () => {
			const segments = [[{ spread: true, content: '...slug', dynamic: true }]];
			const generator = getRouteGenerator(segments, 'always');

			const result = generator({ slug: '/evil.com' });

			assert.ok(
				!result.startsWith('//'),
				`Expected result to not start with '//', got '${result}'`,
			);
		});

		it('does not produce protocol-relative URL with subpath', () => {
			const segments = [[{ spread: true, content: '...slug', dynamic: true }]];
			const generator = getRouteGenerator(segments, 'never');

			const result = generator({ slug: '/evil.com/phish' });

			assert.ok(
				!result.startsWith('//'),
				`Expected result to not start with '//', got '${result}'`,
			);
		});

		it('still produces correct paths for normal params', () => {
			const segments = [[{ spread: true, content: '...slug', dynamic: true }]];
			const generator = getRouteGenerator(segments, 'never');

			assert.equal(generator({ slug: 'about' }), '/about');
			assert.equal(generator({ slug: 'docs/getting-started' }), '/docs/getting-started');
		});

		it('non-root catch-all is not affected', () => {
			// Simulates destination '/new/[...slug]' — catch-all under a prefix
			const segments = [
				[{ spread: false, content: 'new', dynamic: false }],
				[{ spread: true, content: '...slug', dynamic: true }],
			];
			const generator = getRouteGenerator(segments, 'never');

			// Even with a leading-slash param, the prefix prevents protocol-relative
			const result = generator({ slug: '/evil.com' });
			assert.ok(
				!result.startsWith('//'),
				`Expected result to not start with '//', got '${result}'`,
			);
		});
	});
});
