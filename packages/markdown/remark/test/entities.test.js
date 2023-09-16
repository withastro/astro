import { createMarkdownProcessor } from '../dist/index.js';
import { expect } from 'chai';

describe('entities', async () => {
	const processor = await createMarkdownProcessor();

	it('should not unescape entities in regular Markdown', async () => {
		const { code } = await processor.render(`&lt;i&gt;This should NOT be italic&lt;/i&gt;`);

		expect(code).to.equal(`<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>`);
	});
});
