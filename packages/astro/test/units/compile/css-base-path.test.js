import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compileAstro } from '../../../dist/vite-plugin-astro/compile.js';

/**
 * Compile Astro source with a given base path
 * @param {string} source - Astro source code
 * @param {string} base - Base path configuration
 */
async function compileWithBase(source, base = '/') {
	const viteConfig = await resolveConfig({ configFile: false }, 'serve');
	const result = await compileAstro({
		compileProps: {
			astroConfig: {
				root: pathToFileURL('/'),
				base,
				experimental: {},
				build: {
					format: 'directory',
				},
				trailingSlash: 'ignore',
			},
			viteConfig,
			preferences: {
				get: () => Promise.resolve(false),
			},
			filename: '/src/pages/index.astro',
			source,
		},
		astroFileToCompileMetadata: new Map(),
		logger: {
			info: () => {},
			warn: () => {},
			error: () => {},
			debug: () => {},
		},
	});
	return result;
}

describe('CSS Base Path Rewriting', () => {
	describe('Absolute URL rewriting', () => {
		it('should rewrite absolute URLs with base path', async () => {
			const source = `
<style>
	@font-face {
		src: url('/fonts/font.woff2');
	}
</style>`;
			const result = await compileWithBase(source, '/my-base/');

			// CSS should be in result.css array
			assert.ok(result.css.length > 0);
			const css = result.css[0].code;

			// URL should be rewritten to include base
			assert.match(css, /url\(['"]?\/my-base\/fonts\/font\.woff2['"]?\)/);
		});

		it('should rewrite unquoted URLs', async () => {
			const source = `<style>.bg { background: url(/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(\/my-base\/images\/bg\.png\)/);
		});

		it('should rewrite double-quoted URLs', async () => {
			const source = `<style>.bg { background: url("/images/bg.png"); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			// URL should be rewritten (quotes may be preserved or removed by CSS processor)
			assert.ok(css.includes('/my-base/images/bg.png'));
		});

		it('should rewrite single-quoted URLs', async () => {
			const source = `<style>.bg { background: url('/images/bg.png'); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.ok(css.includes('/my-base/images/bg.png'));
		});

		it('should handle base path without trailing slash', async () => {
			const source = `<style>.bg { background: url(/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '/my-base');
			const css = result.css[0].code;

			assert.match(css, /url\(\/my-base\/images\/bg\.png\)/);
		});

		it('should handle nested base paths', async () => {
			const source = `<style>.bg { background: url(/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '/path/to/app/');
			const css = result.css[0].code;

			assert.match(css, /url\(\/path\/to\/app\/images\/bg\.png\)/);
		});

		it('should handle multiple URLs in one declaration', async () => {
			const source = `<style>.multi { background: url(/bg.png), url(/fg.png); }</style>`;
			const result = await compileWithBase(source, '/base/');
			const css = result.css[0].code;

			assert.ok(css.includes('/base/bg.png'));
			assert.ok(css.includes('/base/fg.png'));
		});
	});

	describe('URLs that should NOT be rewritten', () => {
		it('should not rewrite relative URLs starting with ./', async () => {
			const source = `<style>.relative { background: url(./local.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(\.\/local\.png\)/);
			assert.doesNotMatch(css, /\/my-base/);
		});

		it('should not rewrite relative URLs starting with ../', async () => {
			const source = `<style>.relative { background: url(../parent.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(\.\.\/parent\.png\)/);
			assert.doesNotMatch(css, /\/my-base/);
		});

		it('should not rewrite external https:// URLs', async () => {
			const source = `<style>.external { background: url(https://example.com/image.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(https:\/\/example\.com\/image\.png\)/);
			assert.doesNotMatch(css, /\/my-base/);
		});

		it('should not rewrite external http:// URLs', async () => {
			const source = `<style>.external { background: url(http://example.com/image.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(http:\/\/example\.com\/image\.png\)/);
			assert.doesNotMatch(css, /\/my-base/);
		});

		it('should not rewrite data URIs', async () => {
			const source = `<style>.data { background: url(data:image/svg+xml,<svg/>); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(data:image\/svg\+xml/);
			assert.doesNotMatch(css, /\/my-base/);
		});

		it('should not rewrite protocol-relative URLs', async () => {
			const source = `<style>.protocol { background: url(//cdn.example.com/image.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.match(css, /url\(\/\/cdn\.example\.com\/image\.png\)/);
			// Should not have /my-base// (double slash would be wrong)
			assert.doesNotMatch(css, /\/my-base\/\//);
		});

		// Note: @import statements are processed by Vite's CSS plugin separately
		// and will attempt to resolve the imported file. Our rewriteCssUrls function
		// correctly skips @import URLs via negative lookbehind in the regex.
	});

	describe('Edge cases', () => {
		it('should handle base="/" as no-op', async () => {
			const source = `<style>.bg { background: url(/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '/');
			const css = result.css[0].code;

			// Should NOT add extra slash
			assert.match(css, /url\(\/images\/bg\.png\)/);
			assert.doesNotMatch(css, /url\(\/\/images/);
		});

		it('should be idempotent (not double-apply base)', async () => {
			const source = `<style>.bg { background: url(/my-base/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			// Should not become /my-base/my-base/images/bg.png
			assert.match(css, /url\(\/my-base\/images\/bg\.png\)/);
			assert.doesNotMatch(css, /\/my-base\/my-base/);
		});

		it('should handle URLs with whitespace', async () => {
			const source = `<style>.space { background: url(  /images/bg.png  ); }</style>`;
			const result = await compileWithBase(source, '/my-base/');
			const css = result.css[0].code;

			assert.ok(css.includes('/my-base/images/bg.png'));
		});

		it('should handle empty base as no-op', async () => {
			const source = `<style>.bg { background: url(/images/bg.png); }</style>`;
			const result = await compileWithBase(source, '');
			const css = result.css[0].code;

			assert.match(css, /url\(\/images\/bg\.png\)/);
		});
	});

	describe('Complex CSS scenarios', () => {
		it('should handle @font-face with format()', async () => {
			const source = `
<style>
	@font-face {
		font-family: 'Test';
		src: url('/fonts/test.woff2') format('woff2'),
		     url('/fonts/test.woff') format('woff');
	}
</style>`;
			const result = await compileWithBase(source, '/app/');
			const css = result.css[0].code;

			assert.ok(css.includes('/app/fonts/test.woff2'));
			assert.ok(css.includes('/app/fonts/test.woff'));
		});

		it('should handle background shorthand with multiple values', async () => {
			const source = `
<style>
	.complex {
		background: #fff url(/bg.png) no-repeat center/cover;
	}
</style>`;
			const result = await compileWithBase(source, '/base/');
			const css = result.css[0].code;

			assert.ok(css.includes('/base/bg.png'));
		});

		it('should handle image-set()', async () => {
			const source = `
<style>
	.responsive {
		background-image: image-set(
			url(/img-1x.png) 1x,
			url(/img-2x.png) 2x
		);
	}
</style>`;
			const result = await compileWithBase(source, '/base/');
			const css = result.css[0].code;

			// Note: image-set() also contains url() which should be rewritten
			assert.ok(css.includes('/base/img-1x.png') || /\/base\/img-1x\.png/.exec(css));
			assert.ok(css.includes('/base/img-2x.png') || /\/base\/img-2x\.png/.exec(css));
		});

		it('should handle mask-image property', async () => {
			const source = `<style>.mask { mask-image: url(/mask.svg); }</style>`;
			const result = await compileWithBase(source, '/app/');
			const css = result.css[0].code;

			assert.ok(css.includes('/app/mask.svg'));
		});

		it('should handle list-style-image property', async () => {
			const source = `<style>ul { list-style-image: url(/bullet.png); }</style>`;
			const result = await compileWithBase(source, '/app/');
			const css = result.css[0].code;

			assert.ok(css.includes('/app/bullet.png'));
		});

		it('should handle cursor property', async () => {
			const source = `<style>.custom-cursor { cursor: url(/cursor.png), auto; }</style>`;
			const result = await compileWithBase(source, '/app/');
			const css = result.css[0].code;

			assert.ok(css.includes('/app/cursor.png'));
		});

		it('should handle mixed quoted and unquoted URLs', async () => {
			const source = `
<style>
	.mixed {
		background: url(/bg1.png);
		border-image: url('/bg2.png');
		mask: url("/bg3.png");
	}
</style>`;
			const result = await compileWithBase(source, '/base/');
			const css = result.css[0].code;

			assert.ok(css.includes('/base/bg1.png'));
			assert.ok(css.includes('/base/bg2.png'));
			assert.ok(css.includes('/base/bg3.png'));
		});
	});

	describe('Sass/Less/Stylus preprocessing', () => {
		it('should rewrite URLs in Sass', async () => {
			const source = `
<style lang="scss">
	$image-path: '/images';
	.bg {
		background: url('/images/bg.png');
	}
</style>`;
			const result = await compileWithBase(source, '/base/');
			const css = result.css[0].code;

			// After Sass compilation, the URL should be rewritten
			assert.ok(css.includes('/base/images/bg.png'));
		});
	});
});
