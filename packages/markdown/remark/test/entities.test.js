import { renderMarkdown } from '../dist/index.js';
import { expect } from 'chai';

describe('entities', () => {
	it('should not unescape entities in regular Markdown', async () => {
		const { code } = await renderMarkdown(`&lt;i&gt;This should NOT be italic&lt;/i&gt;`, {
			isAstroFlavoredMd: false,
		});

		expect(code).to.equal(`<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>`);
	});

	it('should not escape entities in code blocks twice in Astro-flavored markdown', async () => {
		const { code } = await renderMarkdown(
			`\`\`\`astro\n<h1>{x && x.name || ''}!</h1>\n\`\`\``,
			{
				isAstroFlavoredMd: true,
				syntaxHighlight: false,
			}
		);

		expect(code).to.equal(
			`<pre is:raw><code class="language-astro">&lt;h1&gt;{x &amp;&amp; x.name || ''}!&lt;/h1&gt;\n</code></pre>`
		);
	});
});
