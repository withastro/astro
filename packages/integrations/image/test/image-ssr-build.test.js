import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

describe('SSR images - build', async function () {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-image/',
			adapter: testAdapter({ streaming: false }),
			output: 'server',
		});
		await fixture.build();
	});

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/_astro\/social.\w{8}.jpg/ },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: '/_image',
			query: { f: 'webp', w: '768', h: '414', href: /^\/_astro\/introducing astro.\w{8}.jpg/ },
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			url: '/_image',
			query: { f: 'svg', w: '192', h: '256', href: /^\/_astro\/logo.\w{8}.svg/ },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/_astro\/social.\w{8}.jpg/ },
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'webp',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			url: '/_image',
			query: {
				w: '200',
				h: '300',
				href: 'https://dummyimage.com/200x300',
			},
		},
		{
			title: 'Remote images with search',
			id: '#query',
			url: '/_image',
			query: {
				f: 'webp',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?token=abc',
			},
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'webp', w: '768', h: '414', href: '/hero.jpg' },
		},
		{
			title: 'Background color',
			id: '#bg-color',
			url: '/_image',
			query: {
				f: 'jpeg',
				w: '544',
				h: '184',
				bg: '#333333',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
		},
	].forEach(({ title, id, url, query }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				if (typeof value === 'string') {
					expect(searchParams.get(key)).to.equal(value);
				} else {
					expect(searchParams.get(key)).to.match(value);
				}
			}
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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/docs\/_astro\/social.\w{8}.jpg/ },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: '/_image',
			query: {
				f: 'webp',
				w: '768',
				h: '414',
				href: /^\/docs\/_astro\/introducing astro.\w{8}.jpg/,
			},
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			url: '/_image',
			query: { f: 'svg', w: '192', h: '256', href: /^\/docs\/_astro\/logo.\w{8}.svg/ },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/docs\/_astro\/social.\w{8}.jpg/ },
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'webp',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			url: '/_image',
			query: {
				w: '200',
				h: '300',
				href: 'https://dummyimage.com/200x300',
			},
		},
		{
			title: 'Remote images with search',
			id: '#query',
			url: '/_image',
			query: {
				f: 'webp',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?token=abc',
			},
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'webp', w: '768', h: '414', href: '/docs/hero.jpg' },
		},
		{
			title: 'Background color',
			id: '#bg-color',
			url: '/_image',
			query: {
				f: 'jpeg',
				w: '544',
				h: '184',
				bg: '#333333',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
		},
	].forEach(({ title, id, url, query }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/docs/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				if (typeof value === 'string') {
					expect(searchParams.get(key)).to.equal(value);
				} else {
					expect(searchParams.get(key)).to.match(value);
				}
			}
		});
	});
});
