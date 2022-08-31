import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

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

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
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

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
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

		it('keeps remote image query params', () => {
			const image = $('#query');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?token=abc'
			);
		});
	});

	describe('/public images', () => {
		it('includes src, width, and height attributes', () => {
			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(searchParams.get('href')).to.equal('/hero.jpg');
		});

		it('returns the optimized image', async () => {
			const image = $('#hero');

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal('image/webp');

			// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
		});
	});
});

describe('SSR images with subpath - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-image/',
			adapter: testAdapter(),
			output: 'server',
			base: '/docs',
		});

		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/docs/').then((res) => res.text());
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

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
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

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
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

		it('keeps remote image query params', () => {
			const image = $('#query');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?token=abc'
			);
		});
	});

	describe('/public images', () => {
		it('includes src, width, and height attributes', () => {
			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(searchParams.get('href')).to.equal('/hero.jpg');
		});

		it('returns the optimized image', async () => {
			const image = $('#hero');

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal('image/webp');

			// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
		});
	});
});
