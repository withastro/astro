import { renderMarkdown } from '../dist/index.js';
import { expect } from 'chai';

describe('entities', () => {
	it('should not unescape entities in regular Markdown', async () => {
		const { code } = await renderMarkdown(`&lt;i&gt;This should NOT be italic&lt;/i&gt;`, {});

		expect(code).to.equal(`<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>`);
	});
});
