import { renderMarkdown } from '../dist/index.js';
import { expect } from 'chai';
import { mockRenderMarkdownParams } from './test-utils.js';

describe('entities', () => {
	it('should not unescape entities in regular Markdown', async () => {
		const { code } = await renderMarkdown(
			`&lt;i&gt;This should NOT be italic&lt;/i&gt;`,
			mockRenderMarkdownParams
		);

		expect(code).to.equal(`<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>`);
	});
});
