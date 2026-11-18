import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { RemarkPlugins } from '../dist/index.js';
import { filterStringPlugins, jsToTreeNode } from '../dist/mdx/utils.js';

describe('mdx utils', () => {
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

	describe('filterStringPlugins', () => {
		let warnings: unknown[][];
		const originalWarn = console.warn;

		beforeEach(() => {
			warnings = [];
			console.warn = (...args: unknown[]) => {
				warnings.push(args);
			};
		});
		afterEach(() => {
			console.warn = originalWarn;
		});

		it('returns function plugins unchanged', () => {
			const plugin1 = () => {};
			const plugin2 = () => {};
			const result = filterStringPlugins([plugin1, plugin2] as RemarkPlugins);
			assert.equal(result.length, 2);
			assert.equal(result[0], plugin1);
			assert.equal(result[1], plugin2);
			assert.equal(warnings.length, 0);
		});

		it('filters out string-based plugins', () => {
			const fnPlugin = () => {};
			const result = filterStringPlugins(['remark-toc', fnPlugin] as RemarkPlugins);
			assert.equal(result.length, 1);
			assert.equal(result[0], fnPlugin);
		});

		it('filters out array-based string plugins [string, options]', () => {
			const fnPlugin = () => {};
			const result = filterStringPlugins([['remark-toc', {}], fnPlugin] as RemarkPlugins);
			assert.equal(result.length, 1);
			assert.equal(result[0], fnPlugin);
		});

		it('logs warnings for string plugins', () => {
			filterStringPlugins(['remark-toc', ['rehype-highlight', {}]] as RemarkPlugins);
			// One warning per string plugin + one summary warning
			assert.equal(warnings.length, 3);
		});

		it('returns empty array for all string plugins', () => {
			const result = filterStringPlugins(['remark-toc'] as RemarkPlugins);
			assert.equal(result.length, 0);
		});

		it('handles array-based function plugins [function, options]', () => {
			const fnPlugin = () => {};
			const result = filterStringPlugins([[fnPlugin, { option: true }]] as RemarkPlugins);
			assert.equal(result.length, 1);
			assert.equal(warnings.length, 0);
		});
	});
});
