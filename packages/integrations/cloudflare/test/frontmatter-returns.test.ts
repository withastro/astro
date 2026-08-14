import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { replaceTopLevelReturns } from '../dist/utils/frontmatter.js';

describe('replaceTopLevelReturns', () => {
	it('rewrites a return with a value', () => {
		assert.equal(
			replaceTopLevelReturns('return Astro.redirect("/404")'),
			'throw  Astro.redirect("/404")',
		);
	});

	it('rewrites a bare return', () => {
		assert.equal(replaceTopLevelReturns('if (!source) return;'), 'if (!source) throw 0;');
	});

	it('leaves member accesses alone', () => {
		assert.equal(replaceTopLevelReturns('gen.return()'), 'gen.return()');
	});

	it('leaves strings, template literals and comments alone', () => {
		assert.equal(replaceTopLevelReturns('const a = "return 1";'), 'const a = "return 1";');
		assert.equal(replaceTopLevelReturns('const b = `return 1`;'), 'const b = `return 1`;');
		assert.equal(replaceTopLevelReturns('// return 1'), '// return 1');
		assert.equal(replaceTopLevelReturns('/* return 1 */'), '/* return 1 */');
	});

	it('rewrites returns after a regex literal containing a quote', () => {
		const code = [
			'function escapeHtml(value) {',
			'\treturn value.replace(/"/g, "&quot;");',
			'}',
			'return new Response("Method Not Allowed", { status: 405 });',
		].join('\n');

		assert.equal(
			replaceTopLevelReturns(code),
			[
				'function escapeHtml(value) {',
				'\tthrow  value.replace(/"/g, "&quot;");',
				'}',
				'throw  new Response("Method Not Allowed", { status: 405 });',
			].join('\n'),
		);
	});

	it('rewrites returns after a regex literal that forms a comment or a character class', () => {
		assert.equal(
			replaceTopLevelReturns('const a = p.split(/\\//g);\nreturn a;'),
			'const a = p.split(/\\//g);\nthrow  a;',
		);
		assert.equal(
			replaceTopLevelReturns('const b = /[/"]/.test(p);\nreturn b;'),
			'const b = /[/"]/.test(p);\nthrow  b;',
		);
	});

	it('does not mistake division for a regex literal', () => {
		assert.equal(
			replaceTopLevelReturns('const a = 10 / 2 / 5;\nreturn a;'),
			'const a = 10 / 2 / 5;\nthrow  a;',
		);
	});
});
