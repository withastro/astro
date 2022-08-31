import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

describe('SSR images - build', function () {
	let fixture;

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
			expect(searchParams.get('href')).to.equal('/assets/social.cece8c77.jpg');
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
			expect(searchParams.get('href')).to.equal('/assets/social.cece8c77.jpg');
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
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
		});

		it('keeps remote image query params', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

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
		it('includes src, width, and height attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal('/hero.jpg');
		});
	});
});

describe('SSR images with subpath - build', function () {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-image/',
			adapter: testAdapter({ streaming: false }),
			output: 'server',
			base: '/docs',
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
			expect(searchParams.get('href')).to.equal('/docs/assets/social.cece8c77.jpg');
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
			expect(searchParams.get('href')).to.equal('/docs/assets/social.cece8c77.jpg');
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
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
		});

		it('keeps remote image query params', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

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
		it('includes src, width, and height attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal('/hero.jpg');
		});
	});
});
