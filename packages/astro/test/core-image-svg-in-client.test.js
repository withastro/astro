import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('astro:assets - SVG Components', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-svg-in-client/',
			});

			await fixture.build({});
		});

		it('SVG image is rendered in build output', async () => {
			const files = await fixture.readdir('_astro');
			const bundledReactComponentFilename = files.find(
				(f) => f.startsWith('ReactTest.') && f.endsWith('.js'),
			);
			assert.ok(bundledReactComponentFilename, 'React component was bundled');
			const bundledReactComponent = await fixture.readFile(
				`_astro/${bundledReactComponentFilename}`,
			);
			assert.ok(bundledReactComponent, 'React component bundle is not empty');
			assert.ok(
				bundledReactComponent.length < 1_000,
				`Expected React component bundle to be smaller than 1000 bytes, got ${bundledReactComponent.length} bytes. If this test fails, it is likely that server code has been imported while importing an SVG.`,
			);
		});
	});
});
