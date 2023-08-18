import { expect } from 'chai';
import net from 'node:net';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('API routes in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-api-route/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Basic pages work', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		expect(html).to.not.be.empty;
	});

	it('Can load the API route too', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/food.json');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const body = await response.json();
		expect(body.length).to.equal(3);
	});

	it('Can load the API route too (deprecated object form)', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/food-object.json');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		expect(response.headers.get('Content-Type')).to.equal('application/json;charset=utf-8');
		expect(response.headers.get('Content-Length')).to.not.be.empty;
		const body = await response.json();
		expect(body.length).to.equal(3);
	});

	it('Has valid api context', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/context/any');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const data = await response.json();
		expect(data.cookiesExist).to.equal(true);
		expect(data.requestExist).to.equal(true);
		expect(data.redirectExist).to.equal(true);
		expect(data.propsExist).to.equal(true);
		expect(data.params).to.deep.equal({ param: 'any' });
		expect(data.generator).to.match(/^Astro v/);
		expect(data.url).to.equal('http://example.com/context/any');
		expect(data.clientAddress).to.equal('0.0.0.0');
	});

	describe('API Routes - Dev', () => {
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can POST to API routes', async () => {
			const response = await fixture.fetch('/food.json', {
				method: 'POST',
				body: `some data`,
			});
			expect(response.status).to.equal(200);
			const text = await response.text();
			expect(text).to.equal(`ok`);
		});

		it('Can be passed binary data from multipart formdata', async () => {
			const formData = new FormData();
			const raw = await fs.promises.readFile(
				new URL('./fixtures/ssr-api-route/src/images/penguin.jpg', import.meta.url)
			);
			const file = new File([raw], 'penguin.jpg', { type: 'text/jpg' });
			formData.set('file', file, 'penguin.jpg');

			const res = await fixture.fetch('/binary', {
				method: 'POST',
				body: formData,
			});

			expect(res.status).to.equal(200);
		});

		it('Infer content type with charset for { body } shorthand (deprecated object form)', async () => {
			const response = await fixture.fetch('/food-object.json', {
				method: 'GET',
			});
			expect(response.headers.get('Content-Type')).to.equal('application/json;charset=utf-8');
		});

		it('Can set multiple headers of the same type', async () => {
			const response = await new Promise((resolve) => {
				let { port } = devServer.address;
				let host = 'localhost';
				let socket = new net.Socket();
				socket.connect(port, host);
				socket.on('connect', () => {
					let rawRequest = `POST /login HTTP/1.1\r\nHost: ${host}\r\n\r\n`;
					socket.write(rawRequest);
				});

				let rawResponse = '';
				socket.setEncoding('utf-8');
				socket.on('data', (chunk) => {
					rawResponse += chunk.toString();
					socket.destroy();
				});
				socket.on('close', () => {
					resolve(rawResponse);
				});
			});

			let count = 0;
			let exp = /set-cookie\:/g;
			while (exp.exec(response)) {
				count++;
			}

			expect(count).to.equal(2, 'Found two seperate set-cookie response headers');
		});
	});
});
