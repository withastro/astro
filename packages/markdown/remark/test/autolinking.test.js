import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('autolinking', () => {
	describe('plain md', () => {
		it('autolinks URLs starting with a protocol in plain text', async () => {
			const { code } = await renderMarkdown(`See https://example.com for more.`, {});

			chai
				.expect(code.replace(/\n/g, ''))
				.to.equal(`<p>See <a href="https://example.com">https://example.com</a> for more.</p>`);
		});

		it('autolinks URLs starting with "www." in plain text', async () => {
			const { code } = await renderMarkdown(`See www.example.com for more.`, {});

			chai
				.expect(code.trim())
				.to.equal(`<p>See <a href="http://www.example.com">www.example.com</a> for more.</p>`);
		});

		it('does not autolink URLs in code blocks', async () => {
			const { code } = await renderMarkdown(
				'See `https://example.com` or `www.example.com` for more.',
				{}
			);

			chai
				.expect(code.trim())
				.to.equal(
					`<p>See <code>https://example.com</code> or ` +
						`<code>www.example.com</code> for more.</p>`
				);
		});
	});

	describe('astro-flavored md', () => {
		const renderAstroMd = (text) => renderMarkdown(text, { isAstroFlavoredMd: true });

		it('does not autolink URLs in code blocks', async () => {
			const { code } = await renderAstroMd(
				'See `https://example.com` or `www.example.com` for more.',
				{}
			);

			chai
				.expect(code.trim())
				.to.equal(
					`<p>See <code is:raw>https://example.com</code> or ` +
						`<code is:raw>www.example.com</code> for more.</p>`
				);
		});

		it('does not autolink URLs in fenced code blocks', async () => {
			const { code } = await renderAstroMd(
				'Example:\n```\nGo to https://example.com or www.example.com now.\n```'
			);

			chai
				.expect(code)
				.to.contain(`<pre is:raw`)
				.to.contain(`Go to https://example.com or www.example.com now.`);
		});

		it('does not autolink URLs starting with a protocol when nested inside links', async () => {
			const { code } = await renderAstroMd(
				`See [http://example.com](http://example.com) or ` +
					`<a test href="https://example.com">https://example.com</a>`
			);

			chai
				.expect(code.replace(/\n/g, ''))
				.to.equal(
					`<p>See <a href="http://example.com">http://example.com</a> or ` +
						`<a test href="https://example.com">https://example.com</a></p>`
				);
		});

		it('does not autolink URLs starting with "www." when nested inside links', async () => {
			const { code } = await renderAstroMd(
				`See [www.example.com](https://www.example.com) or ` +
					`<a test href="https://www.example.com">www.example.com</a>`
			);

			chai
				.expect(code.replace(/\n/g, ''))
				.to.equal(
					`<p>See <a href="https://www.example.com">www.example.com</a> or ` +
						`<a test href="https://www.example.com">www.example.com</a></p>`
				);
		});

		it('does not autolink URLs when nested several layers deep inside links', async () => {
			const { code } = await renderAstroMd(
				`<a href="https://www.example.com">**Visit _our www.example.com or ` +
					`http://localhost pages_ for more!**</a>`
			);

			chai
				.expect(code.replace(/\n/g, ''))
				.to.equal(
					`<a href="https://www.example.com"><strong>` +
						`Visit <em>our www.example.com or http://localhost pages</em> for more!` +
						`</strong></a>`
				);
		});
	});
});
