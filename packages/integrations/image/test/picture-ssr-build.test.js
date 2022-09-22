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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/assets\/social.\w{8}.jpg/ },
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/assets\/social.\w{8}.jpg/ },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
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
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'jpg', w: '768', h: '414', href: '/hero.jpg' },
			alt: 'Hero image',
		},
		{
			title: 'Background color',
			id: '#bg-color',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				bg: 'rgb(51, 51, 51)',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
		},
	].forEach(({ title, id, url, query }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $(`${id} source`);

			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/docs\/assets\/social.\w{8}.jpg/ },
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/_image',
			query: { f: 'jpg', w: '506', h: '253', href: /^\/docs\/assets\/social.\w{8}.jpg/ },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
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
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'jpg', w: '768', h: '414', href: '/hero.jpg' },
			alt: 'Hero image',
		},
		{
			title: 'Background color',
			id: '#bg-color',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				bg: 'rgb(51, 51, 51)',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
		},
	].forEach(({ title, id, url, query }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const sources = $(`${id} source`);

			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

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
