import { renderMarkdown } from '../dist/index.js';
import { expect } from 'chai';

describe('entities', () => {
	const renderAstroMd = (text) => renderMarkdown(text, { isAstroFlavoredMd: false });

	it('should not unescape entities', async () => {
		const { code } = await renderAstroMd(`&lt;i&gt;This should NOT be italic&lt;/i&gt;`);

		expect(code).to.equal(`<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>`);
	});
});
