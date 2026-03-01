import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const root = new URL('./fixtures/render-with-transform/', import.meta.url);

/**
 * Tests for issue #9708: Markdoc `transform()` function overrides custom Astro component
 *
 * When spreading a built-in node config (e.g., `...Markdoc.nodes.fence`) and specifying
 * a custom `render` component, the `render` should win over the built-in `transform()`.
 */
describe('Markdoc - render with transform override', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root });
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('uses custom render component instead of built-in transform', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			assertCustomFenceRendered(html);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('uses custom render component instead of built-in transform', async () => {
			const html = await fixture.readFile('/index.html');
			assertCustomFenceRendered(html);
		});
	});
});

function assertCustomFenceRendered(html) {
	const { document } = parseHTML(html);

	// The custom component should render a div with data-custom-fence
	const customFence = document.querySelector('[data-custom-fence]');
	assert.notEqual(
		customFence,
		null,
		'Expected custom fence component to be rendered (div[data-custom-fence])',
	);

	// Verify it has the language attribute
	assert.equal(customFence.getAttribute('data-language'), 'js', 'Expected data-language="js"');

	// The content should be inside a pre > code
	const code = customFence.querySelector('pre code');
	assert.notEqual(code, null, 'Expected pre > code inside custom fence');
	assert.ok(code.textContent.includes('hello'), 'Expected code content to include "hello"');
}
