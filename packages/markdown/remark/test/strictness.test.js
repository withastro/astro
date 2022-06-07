import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('strictness', () => {
	it('should allow self-closing HTML tags (void elements)', async () => {
		const { code } = await renderMarkdown(
			`Use self-closing void elements<br>like word<wbr>break and images: <img src="hi.jpg">`,
			{}
		);

		chai
			.expect(code)
			.to.equal(
				`<p>Use self-closing void elements<br />like word<wbr />break and images: ` +
					`<img src="hi.jpg" /></p>`
			);
	});
});
