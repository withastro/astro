import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from 'astro';
import { appendForwardSlash, getFileInfo } from '../../dist/utils.js';

describe('utils', () => {
	describe('appendForwardSlash', () => {
		it('appends slash when missing', () => {
			assert.equal(appendForwardSlash('/foo'), '/foo/');
		});

		it('does not double-append slash', () => {
			assert.equal(appendForwardSlash('/foo/'), '/foo/');
		});

		it('handles empty string', () => {
			assert.equal(appendForwardSlash(''), '/');
		});

		it('handles root slash', () => {
			assert.equal(appendForwardSlash('/'), '/');
		});
	});

	describe('getFileInfo', () => {
		function mockConfig(overrides: Partial<AstroConfig> = {}): AstroConfig {
			return {
				root: new URL('file:///project/'),
				base: '/',
				site: undefined,
				trailingSlash: 'ignore',
				...overrides,
			} as AstroConfig;
		}

		it('computes fileUrl for pages', () => {
			const config = mockConfig();
			const result = getFileInfo('/project/src/pages/test.mdx', config);
			assert.equal(result.fileId, '/project/src/pages/test.mdx');
			assert.equal(result.fileUrl, '/test');
		});

		it('computes fileUrl for nested pages', () => {
			const config = mockConfig();
			const result = getFileInfo('/project/src/pages/blog/post.mdx', config);
			assert.equal(result.fileUrl, '/blog/post');
		});

		it('strips index from page URLs', () => {
			const config = mockConfig();
			const result = getFileInfo('/project/src/pages/index.mdx', config);
			// The regex strips /index.mdx leaving an empty string
			assert.equal(result.fileUrl, '');
		});

		it('strips query strings from fileId', () => {
			const config = mockConfig();
			const result = getFileInfo('/project/src/pages/test.mdx?astro&lang=mdx', config);
			assert.equal(result.fileId, '/project/src/pages/test.mdx');
		});

		it('uses relative path for non-page files under root', () => {
			const config = mockConfig();
			const result = getFileInfo('/project/src/content/post.mdx', config);
			assert.equal(result.fileUrl, 'src/content/post.mdx');
		});

		it('respects trailingSlash=always', () => {
			const config = mockConfig({ trailingSlash: 'always' });
			const result = getFileInfo('/project/src/pages/test.mdx', config);
			assert.equal(result.fileUrl, '/test/');
		});

		it('respects site + base config for pages', () => {
			const config = mockConfig({
				site: 'https://example.com',
				base: '/blog',
			});
			const result = getFileInfo('/project/src/pages/test.mdx', config);
			assert.equal(result.fileUrl, '/blog/test');
		});

		it('handles files outside project root', () => {
			const config = mockConfig();
			const result = getFileInfo('/other/path/file.mdx', config);
			assert.equal(result.fileId, '/other/path/file.mdx');
			assert.equal(result.fileUrl, '/other/path/file.mdx');
		});
	});
});
