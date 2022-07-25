import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

describe('SSR images - build', function () {
	let fixture;

	function verifyImage(pathname) {
		const url = new URL('./fixtures/basic-image/dist/client' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).not.be.be.undefined;
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-image/',
			adapter: testAdapter({ streaming: false }),
			output: 'server',
		});
		await fixture.build();
	});

	describe('Local images', () => {
		it('includes src, width, and height attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#social-jpg');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
		});

		it('built the optimized image', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#social-jpg');

			const imgRequest = new Request(`http://example.com${image.attr('src')}`);
			const imgResponse = await app.render(imgRequest);

			expect(imgResponse.status).to.equal(200);
			expect(imgResponse.headers.get('Content-Type')).to.equal('image/jpeg');

			// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
		});

		it('includes the original images', () => {
			['/assets/social.jpg', '/assets/social.png', '/assets/blog/introducing-astro.jpg'].map(
				verifyImage
			);
		});
	});

	describe('Inline imports', () => {
		it('includes src, width, and height attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#inline');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
		});
	});

	describe('Remote images', () => {
		it('includes src, width, and height attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#google');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href').endsWith('googlelogo_color_272x92dp.png')).to.equal(true);
		});
	});
});

describe('SSR images - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-image/',
			adapter: testAdapter(),
			output: 'server',
		});

		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Local images', () => {
		it('includes src, width, and height attributes', () => {
			const image = $('#social-jpg');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
		});

		it('returns the optimized image', async () => {
			const image = $('#social-jpg');

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal('image/jpeg');

			// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
		});
	});

	describe('Inline imports', () => {
		it('includes src, width, and height attributes', () => {
			const image = $('#inline');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
		});
	});

	describe('Remote images', () => {
		it('includes src, width, and height attributes', () => {
			const image = $('#google');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
		});
	});
});
