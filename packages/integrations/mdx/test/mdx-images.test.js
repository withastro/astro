import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const imageTestRoutes = ['with-components', 'esm-import', 'content-collection'];

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

		for (const route of imageTestRoutes) {
			it(`supports img component - ${route}`, async () => {
				const res = await fixture.fetch(`/${route}`);
				expect(res.status).to.equal(200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const imgs = document.getElementsByTagName('img');
				expect(imgs.length).to.equal(2);

				const assetsImg = imgs.item(0);
				expect(assetsImg.src.startsWith('/_image')).to.be.true;
				expect(assetsImg.hasAttribute('data-my-image')).to.be.true;

				const publicImg = imgs.item(1);
				expect(publicImg.src).to.equal('/favicon.svg');
				expect(publicImg.hasAttribute('data-my-image')).to.be.true;
			});
		}
	});
});
