import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('API routes in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let errorFixtures;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-api-route/',
			experimental: {
				ssr: true,
			},
			adapter: testAdapter(),
		});
		errorFixtures = await loadFixture({
			root: './fixtures/ssr-api-route-custom-404/',
			experimental: {
				ssr: true,
			},
			server: {
				port: 5173
			},
			adapter: testAdapter(),
		});
		await errorFixtures.build();
		await fixture.build();
	});

	// it('Basic pages work', async () => {
	// 	const app = await fixture.loadTestAdapterApp();
	// 	const request = new Request('http://example.com/');
	// 	const response = await app.render(request);
	// 	const html = await response.text();
	// 	expect(html).to.not.be.empty;
	// });

	// it('Can load the API route too', async () => {
	// 	const app = await fixture.loadTestAdapterApp();
	// 	const request = new Request('http://example.com/food.json');
	// 	const response = await app.render(request);
	// 	expect(response.status).to.equal(200);
	// 	expect(response.headers.get('Content-Type')).to.equal('application/json;charset=utf-8');
	// 	expect(response.headers.get('Content-Length')).to.not.be.empty;
	// 	const body = await response.json();
	// 	expect(body.length).to.equal(3);
	// });

	describe('API Routes - Dev', () => {
		let devServer;
		let errorDevServer;
		before(async () => {
			devServer = await fixture.startDevServer();
			errorDevServer = await errorFixtures.startDevServer();
		});

		after(async () => {
			await devServer.stop();
			await errorDevServer.stop();
		});

		// 	it('Can POST to API routes', async () => {
		// 		const response = await fixture.fetch('/food.json', {
		// 			method: 'POST',
		// 			body: `some data`,
		// 		});
		// 		expect(response.status).to.equal(200);
		// 		const text = await response.text();
		// 		expect(text).to.equal(`ok`);
		// 	});

		// 	it('Infer content type with charset for { body } shorthand', async () => {
		// 		const response = await fixture.fetch('/food.json', {
		// 			method: 'GET',
		// 		});
		// 		expect(response.headers.get('Content-Type')).to.equal('application/json;charset=utf-8');
		// 	});

		// 	it('Can set multiple headers of the same type', async () => {
		// 		const response = await fixture.fetch('/login', {
		// 			method: 'POST',
		// 		});
		// 		const setCookie = response.headers.get('set-cookie');
		// 		expect(setCookie).to.equal('foo=foo; HttpOnly, bar=bar; HttpOnly');
		// 	});

		it('renders default 404 page for /404', async () => {
			const html = await fixture.fetch('/404').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('404:  Not found');
			// expect($('p').text()).to.equal('/a/');
		});

		// it('renders custom 404 page for /a', async () => {
		// 	const html = await errorFixtures.fetch('/a').then((res) => res.text());
		// 	const $ = cheerio.load(html);

		// 	expect($('h1').text()).to.equal('Something went horribly wrong!!');
		// });

		// it('500 page for /500', async () => {
		// 	const html = await fixture.fetch('/500').then((res) => res.text());
		// 	const $ = cheerio.load(html);

		// 	expect($('title').text().length).to.equal('Something went horribly wrong!!');
		// });
	});
});
