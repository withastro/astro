import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';
import { mockRenderMarkdownParams } from './test-utils.js';

describe('autolinking', () => {
	describe('plain md', () => {
		it('autolinks URLs starting with a protocol in plain text', async () => {
			const { code } = await renderMarkdown(
				`See https://example.com for more.`,
				mockRenderMarkdownParams
			);

			chai
				.expect(code.replace(/\n/g, ''))
				.to.equal(`<p>See <a href="https://example.com">https://example.com</a> for more.</p>`);
		});

		it('autolinks URLs starting with "www." in plain text', async () => {
			const { code } = await renderMarkdown(
				`See www.example.com for more.`,
				mockRenderMarkdownParams
			);

			chai
				.expect(code.trim())
				.to.equal(`<p>See <a href="http://www.example.com">www.example.com</a> for more.</p>`);
		});

		it('does not autolink URLs in code blocks', async () => {
			const { code } = await renderMarkdown(
				'See `https://example.com` or `www.example.com` for more.',
				mockRenderMarkdownParams
			);

			chai
				.expect(code.trim())
				.to.equal(
					`<p>See <code>https://example.com</code> or ` +
						`<code>www.example.com</code> for more.</p>`
				);
		});
	});
});
