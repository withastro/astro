import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary.js';
import { getAstroMetadata } from '../../src/core/parseAstro.js';
import { parseHTML } from '../../src/core/parseHTML.js';
import { extractScriptTags } from '../../src/core/parseJS.js';

describe('parseJS - Can find all the scripts in an Astro file', () => {
	it('Can find all the scripts in an Astro file, including nested tags', () => {
		const input = `<script>console.log('hi')</script><div><script>console.log('hi2')</script></div>`;
		const snapshot = ts.ScriptSnapshot.fromString(input);
		const html = parseHTML('something/something/hello.astro', snapshot, 0);
		const astroAst = getAstroMetadata(input).ast;

		const scriptTags = extractScriptTags(
			'something/something/hello.astro',
			snapshot,
			html.htmlDocument,
			astroAst
		);

		expect(scriptTags.length).to.equal(2);
	});
});
