import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('astro:assets - SVG Components in Astro Islands', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-svg-in-client/',
			});

			await fixture.build({});
		});

		it('React bundle size is small when importing an SVG', async () => {
			const files = await fixture.readdir('_astro');
			const bundledReactComponentFilename = files.find(
				(f) => f.startsWith('ReactTest.') && f.endsWith('.js'),
			);
			assert.ok(bundledReactComponentFilename, 'Expected to find React component in build output.');
			const bundledReactComponent = await fixture.readFile(
				`_astro/${bundledReactComponentFilename}`,
			);
			assert.ok(bundledReactComponent, 'Expected React component bundle not to be empty');
			assert.ok(
				bundledReactComponent.length < 1_000,
				`Expected React component bundle to be smaller than 1000 bytes, got ${bundledReactComponent.length} bytes. If this test fails, it is likely that server code has been imported while importing an SVG.`,
			);
		});
	});
});
