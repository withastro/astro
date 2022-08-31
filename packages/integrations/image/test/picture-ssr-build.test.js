import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

describe('SSR pictures - build', function () {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-picture/',
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
	});

	describe('Local images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#social-jpg img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(searchParams.get('href')).to.equal('/assets/social.cece8c77.jpg');
			expect(image.attr('alt')).to.equal('Social image');
		});
	});

	describe('Inline imports', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#inline img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal('/assets/social.cece8c77.jpg');
			expect(image.attr('alt')).to.equal('Inline social image');
		});
	});

	describe('Remote images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#google img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('png');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
			expect(image.attr('alt')).to.equal('Google logo');
		});
	});

	describe('/public images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#hero img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(searchParams.get('href')).to.equal('/hero.jpg');
			expect(image.attr('alt')).to.equal('Hero image');
		});
	});
});

describe('SSR pictures with subpath - build', function () {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-picture/',
			adapter: testAdapter(),
			output: 'server',
			base: '/docs',
		});
		await fixture.build();
	});

	describe('Local images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#social-jpg img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(searchParams.get('href')).to.equal('/docs/assets/social.cece8c77.jpg');
			expect(image.attr('alt')).to.equal('Social image');
		});
	});

	describe('Inline imports', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#inline img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal('/docs/assets/social.cece8c77.jpg');
			expect(image.attr('alt')).to.equal('Inline social image');
		});
	});

	describe('Remote images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#google img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('png');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			// TODO: possible to avoid encoding the full image path?
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
			expect(image.attr('alt')).to.equal('Google logo');
		});
	});

	describe('/public images', () => {
		it('includes sources', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $('#hero img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(searchParams.get('href')).to.equal('/hero.jpg');
			expect(image.attr('alt')).to.equal('Hero image');
		});
	});
});
