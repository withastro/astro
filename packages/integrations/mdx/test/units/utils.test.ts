import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import {
	appendForwardSlash,
	getFileInfo,
	ignoreStringPlugins,
	jsToTreeNode,
} from '../../dist/utils.js';

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

	describe('jsToTreeNode', () => {
		it('parses a simple export statement', () => {
			const node = jsToTreeNode('export const x = 1;');
			const estree = node.data!.estree!;
			assert.equal(node.type, 'mdxjsEsm');
			assert.equal(estree.type, 'Program');
			assert.equal(estree.sourceType, 'module');
			assert.ok(estree.body.length > 0);
		});

		it('parses an import statement', () => {
			const node = jsToTreeNode("import foo from 'bar';");
			assert.equal(node.type, 'mdxjsEsm');
			assert.equal(node.data!.estree!.body[0].type, 'ImportDeclaration');
		});

		it('parses a function export', () => {
			const node = jsToTreeNode('export function getHeadings() { return []; }');
			assert.equal(node.type, 'mdxjsEsm');
			const decl = node.data!.estree!.body[0];
			assert.equal(decl.type, 'ExportNamedDeclaration');
		});

		it('throws on invalid JS', () => {
			assert.throws(() => jsToTreeNode('this is not valid javascript {{{'), {
				name: 'SyntaxError',
			});
		});
	});

	describe('ignoreStringPlugins', () => {
		function mockLogger(): AstroIntegrationLogger & { warnings: string[] } {
			const warnings: string[] = [];
			return {
				warn: (msg: string) => {
					warnings.push(msg);
				},
				warnings,
			} as AstroIntegrationLogger & { warnings: string[] };
		}

		it('returns function plugins unchanged', () => {
			const plugin1 = () => {};
			const plugin2 = () => {};
			const logger = mockLogger();
			const result = ignoreStringPlugins([plugin1, plugin2], logger);
			assert.equal(result.length, 2);
			assert.equal(result[0], plugin1);
			assert.equal(result[1], plugin2);
			assert.equal(logger.warnings.length, 0);
		});

		it('filters out string-based plugins', () => {
			const fnPlugin = () => {};
			const logger = mockLogger();
			const result = ignoreStringPlugins(['remark-toc', fnPlugin], logger);
			assert.equal(result.length, 1);
			assert.equal(result[0], fnPlugin);
		});

		it('filters out array-based string plugins [string, options]', () => {
			const fnPlugin = () => {};
			const logger = mockLogger();
			const result = ignoreStringPlugins([['remark-toc', {}], fnPlugin], logger);
			assert.equal(result.length, 1);
			assert.equal(result[0], fnPlugin);
		});

		it('logs warnings for string plugins', () => {
			const logger = mockLogger();
			ignoreStringPlugins(['remark-toc', ['rehype-highlight', {}]], logger);
			// One warning per string plugin + one summary warning
			assert.equal(logger.warnings.length, 3);
		});

		it('returns empty array for all string plugins', () => {
			const logger = mockLogger();
			const result = ignoreStringPlugins(['remark-toc'], logger);
			assert.equal(result.length, 0);
		});

		it('handles array-based function plugins [function, options]', () => {
			const fnPlugin = () => {};
			const logger = mockLogger();
			const result = ignoreStringPlugins([[fnPlugin, { option: true }]], logger);
			assert.equal(result.length, 1);
			assert.equal(logger.warnings.length, 0);
		});
	});
});
