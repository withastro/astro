import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Page', () => {
	let devServer;
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-images/', import.meta.url),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Optimized images in MDX', () => {
		it('works', async () => {
			const res = await fixture.fetch('/');
			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const imgs = document.getElementsByTagName('img');
			expect(imgs.length).to.equal(4);
			// Image using a relative path
			expect(imgs.item(0).src.startsWith('/_image')).to.be.true;
			// Image using an aliased path
			expect(imgs.item(1).src.startsWith('/_image')).to.be.true;
			// Image with title
			expect(imgs.item(2).title).to.equal('Houston title');
			// Image with spaces in the path
			expect(imgs.item(3).src.startsWith('/_image')).to.be.true;
		});
	});
});
