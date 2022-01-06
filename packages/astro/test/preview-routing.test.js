import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Preview Routing', () => {
	describe('Subpath without trailing slash', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').PreviewServer} */
		let previewServer;

		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/with-subpath-no-trailing-slash/',
				devOptions: {
					port: 4000
				}
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			previewServer && (await previewServer.stop());
		});

		it('404 when loading /', async () => {
			const response = await fixture.fetch('/');
			expect(response.status).to.equal(404);
		});

		it('200 when loading subpath root with trailing slash', async () => {
			const response = await fixture.fetch('/blog/');
			expect(response.status).to.equal(200);
			expect(response.redirected).to.equal(false);
		});

		it('200 when loading subpath root without trailing slash', async () => {
			const response = await fixture.fetch('/blog');
			expect(response.status).to.equal(200);
			expect(response.redirected).to.equal(true);
		});

		it('200 when loading another page with subpath used', async () => {
			const response = await fixture.fetch('/blog/another/');
			expect(response.status).to.equal(200);
		});

		it('200 when loading dynamic route', async () => {
			const response = await fixture.fetch('/blog/1/');
			expect(response.status).to.equal(200);
		});

		it('404 when loading invalid dynamic route', async () => {
			const response = await fixture.fetch('/blog/2/');
			expect(response.status).to.equal(404);
		});
	});
});
