import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

const root = new URL('./fixtures/render-this-context/', import.meta.url);

/**
 * Tests for issue #17458: `this` context is broken in Markdoc custom node transforms
 *
 * When using `this.render` in a custom tag/node transform function,
 * the custom transform should be preserved and props should be passed correctly.
 */
describe('Markdoc - this context in custom transforms', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root });
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('preserves custom transform using this.render and passes props', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			// The custom Aside component should be rendered
			const aside = document.querySelector('[data-aside]');
			assert.notEqual(aside, null, 'Expected aside component to be rendered');

			// The title prop should have been passed through
			const title = document.querySelector('[data-aside-title]');
			assert.notEqual(title, null, 'Expected title to be rendered (props were passed correctly)');
			assert.equal(title!.textContent, 'My Sidenote', 'Expected title text to be "My Sidenote"');

			// The custom transform should have actually run (not been deleted)
			assert.equal(
				aside!.getAttribute('data-transformed'),
				'true',
				'Expected data-transformed="true" to prove the custom transform ran',
			);
		});
	});
});
