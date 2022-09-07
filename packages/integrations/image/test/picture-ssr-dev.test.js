import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

describe('SSR pictures - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-picture/',
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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
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
			contentType: 'image/png',
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			url: '/_image',
			query: {
				f: 'jpg',
				w: '200',
				h: '300',
				href: 'https://picsum.photos/200/300',
			},
			contentType: 'image/jpeg',
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: {
				f: 'jpg',
				w: '768',
				h: '414',
				href: '/hero.jpg',
			},
			contentType: 'image/jpeg',
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
			contentType: 'image/png',
			alt: 'Google logo',
		},
	].forEach(({ title, id, url, query, alt, contentType }) => {
		it(title, async () => {
			const sources = $(`${id} source`);

			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			expect(image.attr('alt')).to.equal(alt);

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal(contentType);
		});
	});
});

describe('SSR pictures with subpath - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic-picture/',
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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
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
			contentType: 'image/png',
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			url: '/_image',
			query: {
				f: 'jpg',
				w: '200',
				h: '300',
				href: 'https://picsum.photos/200/300',
			},
			contentType: 'image/jpeg',
			alt: 'ipsum',
		},
		,
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: {
				f: 'jpg',
				w: '768',
				h: '414',
				href: '/hero.jpg',
			},
			contentType: 'image/jpeg',
			alt: 'Hero image',
		},
	].forEach(({ title, id, url, query, alt, contentType }) => {
		it(title, async () => {
			const sources = $(`${id} source`);

			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			expect(image.attr('alt')).to.equal(alt);

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal(contentType);
		});
	});
});
