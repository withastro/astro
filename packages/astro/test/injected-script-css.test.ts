import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('CSS imported from injectScript page scripts', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/injected-script-css/',
		});
		await fixture.build();
	});

	it('emits the CSS file to the build output', async () => {
		const assets = await fixture.readdir('/_astro');
		const cssFiles = assets.filter((f) => f.endsWith('.css'));
		assert.ok(cssFiles.length > 0, 'Expected at least one CSS file in /_astro');

		// Verify the CSS content includes the injected widget styles
		let foundInjectedCss = false;
		for (const cssFile of cssFiles) {
			const content = await fixture.readFile(`/_astro/${cssFile}`);
			if (content.includes('.injected-widget')) {
				foundInjectedCss = true;
				break;
			}
		}
		assert.ok(foundInjectedCss, 'Expected .injected-widget styles in a CSS file');
	});
});
