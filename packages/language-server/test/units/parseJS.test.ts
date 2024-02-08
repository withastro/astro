import { expect } from 'chai';
import ts from 'typescript/lib/typescript.js';
import { getAstroMetadata } from '../../src/core/parseAstro.js';
import { parseHTML } from '../../src/core/parseHTML.js';
import { extractScriptTags } from '../../src/core/parseJS.js';

describe('parseJS - Can find all the scripts in an Astro file', () => {
	it('Can find all the scripts in an Astro file, including nested tags', () => {
		const input = `<script>console.log('hi')</script><div><script>console.log('hi2')</script></div>`;
		const snapshot = ts.ScriptSnapshot.fromString(input);
		const html = parseHTML(snapshot, 0);
		const astroAst = getAstroMetadata('file.astro', input).ast;

		const scriptTags = extractScriptTags(snapshot, html.htmlDocument, astroAst);

		expect(scriptTags.length).to.equal(2);
	});

	it('Ignore JSON scripts', () => {
		const input = `<script type="application/json">{foo: "bar"}</script>`;
		const snapshot = ts.ScriptSnapshot.fromString(input);
		const html = parseHTML(snapshot, 0);
		const astroAst = getAstroMetadata('file.astro', input).ast;

		const scriptTags = extractScriptTags(snapshot, html.htmlDocument, astroAst);

		expect(scriptTags.length).to.equal(0);
	});

	it('returns the proper capabilities for inline script tags', () => {
		const input = `<script is:inline>console.log('hi')</script>`;
		const snapshot = ts.ScriptSnapshot.fromString(input);
		const html = parseHTML(snapshot, 0);
		const astroAst = getAstroMetadata('file.astro', input).ast;

		const scriptTags = extractScriptTags(snapshot, html.htmlDocument, astroAst);

		scriptTags[0].mappings.forEach((mapping) => {
			expect(mapping.data).to.deep.equal({
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			});
		});
	});
});
