import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { init, parse } from 'es-module-lexer';
import {
	annotateContentExport,
	injectMetadataExports,
	injectUnderscoreFragmentImport,
	isSpecifierImported,
	transformContentExport,
} from '../../dist/vite-plugin-mdx-postprocess.js';

await init;

/**
 * Helper: parse code with es-module-lexer and return [imports, exports]
 */
function parseCode(code) {
	return parse(code);
}

describe('vite-plugin-mdx-postprocess', () => {
	describe('injectUnderscoreFragmentImport', () => {
		it('injects Fragment import when not present', () => {
			const code = `import { jsx } from 'astro/jsx-runtime';`;
			const [imports] = parseCode(code);
			const result = injectUnderscoreFragmentImport(code, imports);
			assert.ok(result.includes("import { Fragment as _Fragment } from 'astro/jsx-runtime'"));
		});

		it('does not inject Fragment import when already present', () => {
			const code = `import { jsx, Fragment as _Fragment } from 'astro/jsx-runtime';`;
			const [imports] = parseCode(code);
			const result = injectUnderscoreFragmentImport(code, imports);
			// Should not have a second import
			const importCount = (result.match(/Fragment as _Fragment/g) || []).length;
			assert.equal(importCount, 1);
		});

		it('does not inject when _Fragment is imported with different spacing', () => {
			const code = `import { _Fragment } from 'astro/jsx-runtime';`;
			const [imports] = parseCode(code);
			const result = injectUnderscoreFragmentImport(code, imports);
			// _Fragment is in the import statement, regex should match
			assert.ok(result.includes("import { _Fragment } from 'astro/jsx-runtime'"));
			// Should not add a second Fragment import
			const fragmentImports = result.match(/from 'astro\/jsx-runtime'/g) || [];
			assert.equal(fragmentImports.length, 1);
		});

		it('injects Fragment import when import is from a different source', () => {
			const code = `import { Fragment as _Fragment } from 'react/jsx-runtime';`;
			const [imports] = parseCode(code);
			const result = injectUnderscoreFragmentImport(code, imports);
			assert.ok(result.includes("import { Fragment as _Fragment } from 'astro/jsx-runtime'"));
		});
	});

	describe('injectMetadataExports', () => {
		it('injects url and file exports when not present', () => {
			const code = `export const frontmatter = {};`;
			const [, exports] = parseCode(code);
			const result = injectMetadataExports(code, exports, {
				fileUrl: '/test-page',
				fileId: '/src/pages/test-page.mdx',
			});
			assert.ok(result.includes('export const url = "/test-page"'));
			assert.ok(result.includes('export const file = "/src/pages/test-page.mdx"'));
		});

		it('does not inject url export when already present', () => {
			const code = `export const url = "/custom";`;
			const [, exports] = parseCode(code);
			const result = injectMetadataExports(code, exports, {
				fileUrl: '/test-page',
				fileId: '/src/pages/test-page.mdx',
			});
			// Should not add a second url export
			const urlExports = (result.match(/export const url/g) || []).length;
			assert.equal(urlExports, 1);
			// But should still add file
			assert.ok(result.includes('export const file = "/src/pages/test-page.mdx"'));
		});

		it('does not inject file export when already present', () => {
			const code = `export const file = "/custom.mdx";`;
			const [, exports] = parseCode(code);
			const result = injectMetadataExports(code, exports, {
				fileUrl: '/test-page',
				fileId: '/src/pages/test-page.mdx',
			});
			const fileExports = (result.match(/export const file/g) || []).length;
			assert.equal(fileExports, 1);
			// But should still add url
			assert.ok(result.includes('export const url = "/test-page"'));
		});

		it('escapes special characters in fileUrl and fileId', () => {
			const code = `export const frontmatter = {};`;
			const [, exports] = parseCode(code);
			const result = injectMetadataExports(code, exports, {
				fileUrl: '/path/with "quotes"',
				fileId: '/src/pages/with "quotes".mdx',
			});
			// JSON.stringify handles escaping
			assert.ok(result.includes('export const url = "/path/with \\"quotes\\""'));
			assert.ok(result.includes('export const file = "/src/pages/with \\"quotes\\".mdx"'));
		});
	});

	describe('transformContentExport', () => {
		it('wraps MDXContent as Content export', () => {
			const code = `export default function MDXContent(props) { return jsx("div", {}); }`;
			const [, exports] = parseCode(code);
			const result = transformContentExport(code, exports);
			// Should remove "export default" from MDXContent
			assert.ok(result.includes('function MDXContent'));
			assert.ok(!result.includes('export default function MDXContent'));
			// Should create Content wrapper
			assert.ok(result.includes('export const Content'));
			assert.ok(result.includes('export default Content'));
			// Should pass Fragment
			assert.ok(result.includes('Fragment: _Fragment'));
		});

		it('skips transformation when Content export already exists', () => {
			const code = `export const Content = () => {};\nexport default function MDXContent(props) { return jsx("div", {}); }`;
			const [, exports] = parseCode(code);
			const result = transformContentExport(code, exports);
			// Should return code unchanged
			assert.equal(result, code);
		});

		it('includes components spread when components export exists', () => {
			const code = [
				`export const components = { h1: CustomH1 };`,
				`export default function MDXContent(props) { return jsx("div", {}); }`,
			].join('\n');
			const [, exports] = parseCode(code);
			const result = transformContentExport(code, exports);
			assert.ok(result.includes('...components'));
		});

		it('does not include components spread when no components export', () => {
			const code = `export default function MDXContent(props) { return jsx("div", {}); }`;
			const [, exports] = parseCode(code);
			const result = transformContentExport(code, exports);
			assert.ok(!result.includes('...components,'));
		});

		it('includes astro-image handling when __usesAstroImage flag is exported', () => {
			const code = [
				`export const __usesAstroImage = true;`,
				`export default function MDXContent(props) { return jsx("div", {}); }`,
			].join('\n');
			const [, exports] = parseCode(code);
			const result = transformContentExport(code, exports);
			assert.ok(result.includes('astro-image'));
		});
	});

	describe('annotateContentExport', () => {
		it('adds mdx-component symbol', () => {
			const code = `export const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/test.mdx', false, imports);
			assert.ok(result.includes("Content[Symbol.for('mdx-component')] = true"));
		});

		it('adds needsHeadRendering symbol', () => {
			const code = `export const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/test.mdx', false, imports);
			assert.ok(result.includes("Content[Symbol.for('astro.needsHeadRendering')]"));
		});

		it('adds moduleId', () => {
			const code = `export const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/src/pages/test.mdx', false, imports);
			assert.ok(result.includes('Content.moduleId = "/src/pages/test.mdx"'));
		});

		it('adds __astro_tag_component__ import and call in SSR mode', () => {
			const code = `export const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/test.mdx', true, imports);
			assert.ok(result.includes('import { __astro_tag_component__ }'));
			assert.ok(result.includes("__astro_tag_component__(Content, 'astro:jsx')"));
		});

		it('does not add __astro_tag_component__ in non-SSR mode', () => {
			const code = `export const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/test.mdx', false, imports);
			assert.ok(!result.includes('__astro_tag_component__'));
		});

		it('does not duplicate __astro_tag_component__ import when already present', () => {
			const code = `import { __astro_tag_component__ } from 'astro/runtime/server/index.js';\nexport const Content = () => {};`;
			const [imports] = parseCode(code);
			const result = annotateContentExport(code, '/test.mdx', true, imports);
			const importCount = (
				result.match(/import.*__astro_tag_component__.*astro\/runtime\/server/g) || []
			).length;
			assert.equal(importCount, 1);
		});
	});

	describe('isSpecifierImported', () => {
		it('returns true when specifier matches in correct source', () => {
			const code = `import { Fragment as _Fragment } from 'astro/jsx-runtime';`;
			const [imports] = parseCode(code);
			const regex = /[\s,{]_Fragment[\s,}]/;
			assert.equal(isSpecifierImported(code, imports, regex, 'astro/jsx-runtime'), true);
		});

		it('returns false when specifier is from different source', () => {
			const code = `import { Fragment as _Fragment } from 'react/jsx-runtime';`;
			const [imports] = parseCode(code);
			const regex = /[\s,{]_Fragment[\s,}]/;
			assert.equal(isSpecifierImported(code, imports, regex, 'astro/jsx-runtime'), false);
		});

		it('returns false when specifier is not imported', () => {
			const code = `import { jsx } from 'astro/jsx-runtime';`;
			const [imports] = parseCode(code);
			const regex = /[\s,{]_Fragment[\s,}]/;
			assert.equal(isSpecifierImported(code, imports, regex, 'astro/jsx-runtime'), false);
		});

		it('returns false with no imports', () => {
			const code = `const x = 1;`;
			const [imports] = parseCode(code);
			const regex = /[\s,{]_Fragment[\s,}]/;
			assert.equal(isSpecifierImported(code, imports, regex, 'astro/jsx-runtime'), false);
		});
	});
});
