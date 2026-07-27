import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBuildInternals } from '../../../dist/core/build/internal.js';
import { contentAssetsBuildPostHook } from '../../../dist/content/vite-plugin-content-assets.js';
import { STYLES_PLACEHOLDER } from '../../../dist/content/consts.js';

// Verify that later declared styles take precedence in the CSS cascade.
// Refer: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction
describe('content collections - propagated CSS order', () => {
	it('preserves the original order between an external stylesheet and a later inline style', async () => {
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
				code: `const collectedStylesheets = ${JSON.stringify(STYLES_PLACEHOLDER)};`,
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
		const match = /const collectedStylesheets = (\[.*?\]);/.exec(mutatedCode);
		assert.ok(match);
		const actualRenderOrder = JSON.parse(match[1]);

		// The correct order is the one the styles were actually declared in.
		const expectedOrder = [
			{ type: 'external', src: '/_astro/a.css' },
			{ type: 'inline', content: '.cascade-test{color:blue}' },
		];

		assert.deepEqual(actualRenderOrder, expectedOrder);
	});
});
