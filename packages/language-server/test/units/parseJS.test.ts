import assert from 'node:assert';
import { describe, it } from 'node:test';
import { astro2tsx } from '../../dist/core/astro2tsx.js';
import { extractScriptTags } from '../../dist/core/parseJS.js';

describe('parseJS - Can find all the scripts in an Astro file', () => {
	it('Can find all the scripts in an Astro file, including nested tags', () => {
		const input = `<script>console.log('hi')</script><div><script>console.log('hi2')</script></div>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

		assert.strictEqual(scriptTags.length, 2);
	});

	it('Includes JSON scripts', () => {
		const input = `<script type="application/json">{foo: "bar"}</script>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

		assert.strictEqual(scriptTags.length, 1);
	});

	it('returns the proper capabilities for inline script tags', async () => {
		const input = `<script is:inline>console.log('hi')</script>`;
		const { ranges } = astro2tsx(input, 'file.astro');
		const scriptTags = extractScriptTags(ranges.scripts);

		scriptTags[0].mappings.forEach((mapping) => {
			assert.deepStrictEqual(mapping.data, {
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
