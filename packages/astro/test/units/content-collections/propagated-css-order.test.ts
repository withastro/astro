import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBuildInternals } from '../../../dist/core/build/internal.js';
import { contentAssetsBuildPostHook } from '../../../dist/content/vite-plugin-content-assets.js';
import { LINKS_PLACEHOLDER, STYLES_PLACEHOLDER } from '../../../dist/content/consts.js';

// Verify that later declared styles take precedence in the CSS cascade.
// Refer: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction
describe('content collections - propagated CSS order', () => {
	it('loses the original order between an external stylesheet and a later inline style', async () => {
		const internals = createBuildInternals();
		const moduleId = '/src/content/docs/entry.mdx?astroPropagatedAssets';

		internals.propagatedStylesMap.set(
			moduleId,
			new Set([
				{ type: 'external', src: '/_astro/a.css' },
				{ type: 'inline', content: '.cascade-test{color:blue}' },
			]),
		);

		const chunks = [
			{
				fileName: 'entry.js',
				code: `const collectedLinks = ${JSON.stringify(LINKS_PLACEHOLDER)};\nconst collectedStyles = ${JSON.stringify(STYLES_PLACEHOLDER)};`,
				moduleIds: [moduleId],
				prerender: false,
			},
		];

		let mutatedCode: string | undefined;
		await contentAssetsBuildPostHook('/', undefined, internals, {
			chunks,
			mutate: (_fileName, code) => {
				mutatedCode = code;
			},
		});

		assert.ok(mutatedCode);
		const linksMatch = /const collectedLinks = (\[.*?\]);/.exec(mutatedCode);
		const stylesMatch = /const collectedStyles = (\[.*?\]);/.exec(mutatedCode);
		assert.ok(linksMatch && stylesMatch);
		const links: string[] = JSON.parse(linksMatch[1]);
		const styles: string[] = JSON.parse(stylesMatch[1]);

		const actualRenderOrder = [
			...styles.map((content) => ({ type: 'inline', content })),
			...links.map((src) => ({ type: 'external', src })),
		];

		// The correct order is the one the styles were actually declared in.
		const expectedOrder = [
			{ type: 'external', src: '/_astro/a.css' },
			{ type: 'inline', content: '.cascade-test{color:blue}' },
		];

		assert.deepEqual( actualRenderOrder, expectedOrder,);
	});
});
