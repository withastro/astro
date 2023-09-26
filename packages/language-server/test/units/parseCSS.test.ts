import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary.js';
import { getAstroMetadata } from '../../src/core/parseAstro.js';
import { extractStylesheets } from '../../src/core/parseCSS.js';
import { parseHTML } from '../../src/core/parseHTML.js';

describe('parseCSS - Can find all the styles in an Astro file', () => {
	it('Can find all the styles in an Astro file, including nested tags', () => {
		const input = `<style>h1{color: blue;}</style><div><style>h2{color: red;}</style></div>`;
		const snapshot = ts.ScriptSnapshot.fromString(input);
		const html = parseHTML('something/style/hello.astro', snapshot, 0);
		const astroAst = getAstroMetadata(input).ast;

		const styleTags = extractStylesheets(
			'something/style/hello.astro',
			snapshot,
			html.htmlDocument,
			astroAst
		);

		expect(styleTags.length).to.equal(2);
	});
});
