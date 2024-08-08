import { expect } from 'chai';
import { astro2tsx } from '../../dist/core/astro2tsx.js';
import { extractScriptTags } from '../../dist/core/parseJS.js';

describe('parseJS - Can find all the scripts in an Astro file', () => {
	it('Can find all the scripts in an Astro file, including nested tags', () => {
		const input = `<script>console.log('hi')</script><div><script>console.log('hi2')</script></div>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

		expect(scriptTags.length).to.equal(2);
	});

	it('Includes JSON scripts', () => {
		const input = `<script type="application/json">{foo: "bar"}</script>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

		expect(scriptTags.length).to.equal(1);
	});

	it('returns the proper capabilities for inline script tags', async () => {
		const input = `<script is:inline>console.log('hi')</script>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

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
