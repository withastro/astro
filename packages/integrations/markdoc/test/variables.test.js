import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';
import markdoc from '../dist/index.js';

const root = new URL('./fixtures/variables/', import.meta.url);

describe('Markdoc - Variables', () => {
	let baseFixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await baseFixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('has expected entry properties', async () => {
			const res = await baseFixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			expect(document.querySelector('h1')?.textContent).to.equal('Processed by schema: Test entry');
			expect(document.getElementById('id')?.textContent?.trim()).to.equal('id: entry.mdoc');
			expect(document.getElementById('slug')?.textContent?.trim()).to.equal('slug: entry');
			expect(document.getElementById('collection')?.textContent?.trim()).to.equal(
				'collection: blog'
			);
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('has expected entry properties', async () => {
			const html = await baseFixture.readFile('/index.html');
			const { document } = parseHTML(html);
			expect(document.querySelector('h1')?.textContent).to.equal('Processed by schema: Test entry');
			expect(document.getElementById('id')?.textContent?.trim()).to.equal('id: entry.mdoc');
			expect(document.getElementById('slug')?.textContent?.trim()).to.equal('slug: entry');
			expect(document.getElementById('collection')?.textContent?.trim()).to.equal(
				'collection: blog'
			);
		});
	});
});
