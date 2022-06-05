import { expect } from 'chai';
import { loadFixture, server } from './test-utils.js';

describe('Cloudflare Worker', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let _fixture;
	/** @type {import('./test-utils.js').ServerController} */
	let _server;

	before(async () => {
		const root = new URL('./fixtures/worker/', import.meta.url);
		const site = new URL('http://localhost:8788'); // {8788} Wrangler default port

		/** @type {import('astro').AstroConfig}  */
		_fixture = await loadFixture({
			root: root,
			site: site.toString(),
		});

		await _fixture.build();

		_server = await server(_fixture.config.outDir, site, ['--binding', 'COLOR="yellow"']);
	});

	after(async () => {
		await _server?.done();
	});

	describe('HTML', () => {
		it('can fetch homepage', async () => {
			const response = await fetch(new URL('/', _fixture.config.site));
			const html = await response.text();

			expect(response.status).to.equal(200);
			expect(html).to.include('<h1>Homepage</h1>');
		});

		it('can fetch dynamic route', async () => {
			const response = await fetch(new URL('/blog/an-unmissable-post', _fixture.config.site));
			const html = await response.text();

			expect(response.status).to.equal(200);
			expect(html).to.include('<h1>Blog Post</h1>');
			expect(html).to.include('<p>an-unmissable-post</p>');
		});

		it('can fetch asset', async () => {
			const { status } = await fetch(new URL('/images/photo.jpg', _fixture.config.site), {
				method: 'HEAD',
			});

			expect(status).to.equal(200);
		});

		it('should be 404', async () => {
			const response = await fetch(new URL('/oops', _fixture.config.site));
			const html = await response.text();

			expect(response.status).to.equal(404);
			expect(html).to.include('<h1>Page Not Found</h1>');
		});

		it(`should be redirected`, async () => {
			const response = await fetch(new URL('/article/post-1', _fixture.config.site), {
				redirect: 'follow',
			});

			expect(response.redirected).to.equal(true);
			expect(new URL(response.url).pathname).to.equal('/blog/post-1');
		});
	});

	describe('API', () => {
		it(`[GET] should return 'kelpie'`, async () => {
			const response = await fetch(new URL('/api/search?query=kelpie', _fixture.config.site));
			const text = await response.text();

			expect(response.status).to.equal(200);
			expect(text).to.equal('kelpie');
		});

		it(`[POST] should return 'woof'`, async () => {
			const formData = new FormData();
			formData.set('username', 'woof');

			const response = await fetch(new URL('/api/login', _fixture.config.site), {
				method: 'post',
				body: formData,
			});

			const text = await response.text();

			expect(response.status).to.equal(200);
			expect(text).to.equal('woof');
		});
	});

	describe('Headers', () => {
		it('should return x-test header', async () => {
			const response = await fetch(new URL('/', _fixture.config.site));
			const xTestHeader = response.headers.get('x-test');

			expect(xTestHeader).to.equal('ok');
		});
	});
});
