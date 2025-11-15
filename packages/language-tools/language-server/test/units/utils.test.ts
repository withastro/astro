import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Point } from '@astrojs/compiler/types.js';
import { Range } from '@volar/language-server';
import type { Node } from 'vscode-html-languageservice';
import * as html from 'vscode-html-languageservice';
import { getTSXRangesAsLSPRanges, safeConvertToTSX } from '../../dist/core/astro2tsx.js';
import * as compilerUtils from '../../dist/core/compilerUtils.js';
import { getAstroMetadata } from '../../dist/core/parseAstro.js';
import * as utils from '../../dist/plugins/utils.js';

describe('Utilities', async () => {
	it('isTsDocument - properly return if a document is JavaScript', () => {
		assert.strictEqual(utils.isJSDocument('javascript'), true);
		assert.strictEqual(utils.isJSDocument('typescript'), true);
		assert.strictEqual(utils.isJSDocument('javascriptreact'), true);
		assert.strictEqual(utils.isJSDocument('typescriptreact'), true);
	});

	it('isPossibleComponent - properly return if a node is a component', () => {
		const node = {
			tag: 'div',
		} as Node;
		assert.strictEqual(utils.isPossibleComponent(node), false);

		const component = {
			tag: 'MyComponent',
		} as Node;
		assert.strictEqual(utils.isPossibleComponent(component), true);

		const namespacedComponent = {
			tag: 'components.MyOtherComponent',
		} as Node;
		assert.strictEqual(utils.isPossibleComponent(namespacedComponent), true);
	});

	it('isInComponentStartTag - properly return if a given offset is inside the start tag of a component', () => {
		const htmlLs = html.getLanguageService();
		const htmlContent = `<div><Component astr></Component></div>`;
		const htmlDoc = htmlLs.parseHTMLDocument({ getText: () => htmlContent } as any);

		assert.strictEqual(utils.isInComponentStartTag(htmlDoc, 3), false);
		assert.strictEqual(utils.isInComponentStartTag(htmlDoc, 16), true);
	});

	it('isInsideExpression - properly return if a given position is inside a JSX expression', () => {
		const template = `<div>{expression}</div>`;
		assert.strictEqual(utils.isInsideExpression(template, 0, 0), false);
		assert.strictEqual(utils.isInsideExpression(template, 0, 6), true);
	});

	it('isInsideFrontmatter - properly return if a given offset is inside the frontmatter', () => {
		const hasFrontmatter = getAstroMetadata('file.astro', '---\nfoo\n---\n');
		assert.strictEqual(utils.isInsideFrontmatter(0, hasFrontmatter.frontmatter), false);
		assert.strictEqual(utils.isInsideFrontmatter(6, hasFrontmatter.frontmatter), true);
		assert.strictEqual(utils.isInsideFrontmatter(15, hasFrontmatter.frontmatter), false);

		const noFrontmatter = getAstroMetadata('file.astro', '<div></div>');
		assert.strictEqual(utils.isInsideFrontmatter(0, noFrontmatter.frontmatter), false);
		assert.strictEqual(utils.isInsideFrontmatter(6, noFrontmatter.frontmatter), false);

		const openFrontmatter = getAstroMetadata('file.astro', '---\nfoo\n');
		assert.strictEqual(utils.isInsideFrontmatter(0, openFrontmatter.frontmatter), false);
		assert.strictEqual(utils.isInsideFrontmatter(6, openFrontmatter.frontmatter), true);
	});

	it('PointToPosition - properly transform a Point from the Astro compiler to an LSP Position', () => {
		const point: Point = {
			line: 1,
			column: 2,
			offset: 3,
		};
		assert.deepStrictEqual(compilerUtils.PointToPosition(point), {
			line: 0,
			character: 1,
		});
	});

	it('ensureRangeIsInFrontmatter - properly return a range inside the frontmatter', () => {
		const beforeFrontmatterRange = Range.create(0, 0, 0, 0);
		const input = '---\nfoo\n---\n';
		const tsx = safeConvertToTSX(input, { filename: 'file.astro' });
		const tsxRanges = getTSXRangesAsLSPRanges(tsx);
		const astroMetadata = { tsxRanges, ...getAstroMetadata('file.astro', input) };

		assert.deepStrictEqual(
			utils.ensureRangeIsInFrontmatter(beforeFrontmatterRange, astroMetadata),
			Range.create(2, 0, 2, 0),
		);

		const insideFrontmatterRange = Range.create(1, 0, 1, 0);
		assert.deepStrictEqual(
			utils.ensureRangeIsInFrontmatter(insideFrontmatterRange, astroMetadata),
			Range.create(2, 0, 2, 0),
		);

		const outsideFrontmatterRange = Range.create(6, 0, 6, 0);
		assert.deepStrictEqual(
			utils.ensureRangeIsInFrontmatter(outsideFrontmatterRange, astroMetadata),
			Range.create(2, 0, 2, 0),
		);
	});

	it('getNewFrontmatterEdit - properly return a new frontmatter edit', () => {
		const input = '<div></div>';
		const tsx = safeConvertToTSX(input, { filename: 'file.astro' });
		const tsxRanges = getTSXRangesAsLSPRanges(tsx);
		const astroMetadata = { tsxRanges, ...getAstroMetadata('file.astro', input) };
		const edit = utils.getNewFrontmatterEdit(
			{ range: Range.create(43, 0, 44, 0), newText: 'foo' },
			astroMetadata,
			'\n',
		);
		assert.deepStrictEqual(edit, {
			range: Range.create(2, 0, 2, 0),
			newText: '---\nfoo---\n\n',
		});
	});

	it('getOpenFrontmatterEdit - properly return an open frontmatter edit', () => {
		const input = '<div></div>';
		const tsx = safeConvertToTSX(input, { filename: 'file.astro' });
		const tsxRanges = getTSXRangesAsLSPRanges(tsx);
		const astroMetadata = { tsxRanges, ...getAstroMetadata('file.astro', input) };
		const edit = utils.getOpenFrontmatterEdit(
			{ range: Range.create(2, 0, 2, 0), newText: 'foo' },
			astroMetadata,
			'\n',
		);

		assert.deepStrictEqual(edit, {
			range: Range.create(2, 0, 2, 0),
			newText: '\nfoo---',
		});
	});
});
