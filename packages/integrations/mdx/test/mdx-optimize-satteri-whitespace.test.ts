import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('MDX optimize + Satteri whitespace between custom components', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-optimize-satteri-whitespace/', import.meta.url),
		});
		await fixture.build();
	});

	it('preserves whitespace between custom components passed via Content', async () => {
		const html = await fixture.readFile('/content/index.html');
		const { document } = parseHTML(html);

		const spans = document.querySelectorAll('span');
		// There should be 4 spans: 2 native + 2 custom (rendered as <span>)
		assert.equal(spans.length, 4);

		// The custom Span components (last two) should have whitespace between them,
		// just like the native span elements (first two)
		const body = document.querySelector('body')!;
		const bodyHtml = body.innerHTML;

		// Both native spans and custom Span components should NOT be directly adjacent
		assert.doesNotMatch(
			bodyHtml,
			/<\/span><span>world/,
			'whitespace between custom components should be preserved',
		);
	});
});
