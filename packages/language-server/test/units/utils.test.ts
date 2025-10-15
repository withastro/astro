import type { Point } from '@astrojs/compiler/types.js';
import { Range } from '@volar/language-server';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import type { Node } from 'vscode-html-languageservice';
import * as html from 'vscode-html-languageservice';
import { getTSXRangesAsLSPRanges, safeConvertToTSX } from '../../dist/core/astro2tsx.js';
import * as compilerUtils from '../../dist/core/compilerUtils.js';
import { getAstroMetadata } from '../../dist/core/parseAstro.js';
import * as utils from '../../dist/plugins/utils.js';

describe('Utilities', async () => {
	it('isTsDocument - properly return if a document is JavaScript', () => {
		expect(utils.isJSDocument('javascript')).to.be.true;
		expect(utils.isJSDocument('typescript')).to.be.true;
		expect(utils.isJSDocument('javascriptreact')).to.be.true;
		expect(utils.isJSDocument('typescriptreact')).to.be.true;
	});

	it('isPossibleComponent - properly return if a node is a component', () => {
		const node = {
			tag: 'div',
		} as Node;
		expect(utils.isPossibleComponent(node)).to.be.false;

		const component = {
			tag: 'MyComponent',
		} as Node;
		expect(utils.isPossibleComponent(component)).to.be.true;

		const namespacedComponent = {
			tag: 'components.MyOtherComponent',
		} as Node;
		expect(utils.isPossibleComponent(namespacedComponent)).to.be.true;
	});

	it('isInComponentStartTag - properly return if a given offset is inside the start tag of a component', () => {
		const htmlLs = html.getLanguageService();
		const htmlContent = `<div><Component astr></Component></div>`;
		const htmlDoc = htmlLs.parseHTMLDocument({ getText: () => htmlContent } as any);

		expect(utils.isInComponentStartTag(htmlDoc, 3)).to.be.false;
		expect(utils.isInComponentStartTag(htmlDoc, 16)).to.be.true;
	});

	it('isInsideExpression - properly return if a given position is inside a JSX expression', () => {
		const template = `<div>{expression}</div>`;
		expect(utils.isInsideExpression(template, 0, 0)).to.be.false;
		expect(utils.isInsideExpression(template, 0, 6)).to.be.true;
	});

	it('isInsideFrontmatter - properly return if a given offset is inside the frontmatter', () => {
		const hasFrontmatter = getAstroMetadata('file.astro', '---\nfoo\n---\n');
		expect(utils.isInsideFrontmatter(0, hasFrontmatter.frontmatter)).to.be.false;
		expect(utils.isInsideFrontmatter(6, hasFrontmatter.frontmatter)).to.be.true;
		expect(utils.isInsideFrontmatter(15, hasFrontmatter.frontmatter)).to.be.false;

		const noFrontmatter = getAstroMetadata('file.astro', '<div></div>');
		expect(utils.isInsideFrontmatter(0, noFrontmatter.frontmatter)).to.be.false;
		expect(utils.isInsideFrontmatter(6, noFrontmatter.frontmatter)).to.be.false;

		const openFrontmatter = getAstroMetadata('file.astro', '---\nfoo\n');
		expect(utils.isInsideFrontmatter(0, openFrontmatter.frontmatter)).to.be.false;
		expect(utils.isInsideFrontmatter(6, openFrontmatter.frontmatter)).to.be.true;
	});

	it('PointToPosition - properly transform a Point from the Astro compiler to an LSP Position', () => {
		const point: Point = {
			line: 1,
			column: 2,
			offset: 3,
		};
		expect(compilerUtils.PointToPosition(point)).to.deep.equal({
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

		expect(utils.ensureRangeIsInFrontmatter(beforeFrontmatterRange, astroMetadata)).to.deep.equal(
			Range.create(2, 0, 2, 0),
		);

		const insideFrontmatterRange = Range.create(1, 0, 1, 0);
		expect(utils.ensureRangeIsInFrontmatter(insideFrontmatterRange, astroMetadata)).to.deep.equal(
			Range.create(2, 0, 2, 0),
		);

		const outsideFrontmatterRange = Range.create(6, 0, 6, 0);
		expect(utils.ensureRangeIsInFrontmatter(outsideFrontmatterRange, astroMetadata)).to.deep.equal(
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
		expect(edit).to.deep.equal({
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

		expect(edit).to.deep.equal({
			range: Range.create(2, 0, 2, 0),
			newText: '\nfoo---',
		});
	});
});
