import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

describe('SSG images - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/' });
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
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: '/@astroimage/assets/blog/introducing astro.jpg',
			query: { f: 'webp', w: '768', h: '414' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
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
		it(title, () => {
			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}
		});
	});
});

describe('SSG images with subpath - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/', base: '/docs' });
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
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: '/@astroimage/assets/blog/introducing astro.jpg',
			query: { f: 'webp', w: '768', h: '414' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
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
		it(title, () => {
			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}
		});
	});
});

describe('SSG images - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			regex: /^\/assets\/introducing astro.\w{8}_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			regex: /^\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/assets\/googlelogo_color_272x92dp_\w{4,10}.webp/,
			size: { width: 544, height: 184, type: 'webp' },
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/assets\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/assets\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Remote images',
			id: '#bg-color',
			regex: /^\/assets\/googlelogo_color_272x92dp_\w{4,10}.jpeg/,
			size: { width: 544, height: 184, type: 'jpg' },
		},
	].forEach(({ title, id, regex, size }) => {
		it(title, () => {
			const image = $(id);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());

			verifyImage(image.attr('src'), size);
		});
	});
});

describe('SSG images with subpath - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/', base: '/docs' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/docs\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			regex: /^\/docs\/assets\/introducing astro.\w{8}_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			regex: /^\/docs\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/docs\/assets\/googlelogo_color_272x92dp_\w{4,10}.webp/,
			size: { width: 544, height: 184, type: 'webp' },
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/docs\/assets\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/docs\/assets\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Remote images',
			id: '#bg-color',
			regex: /^\/docs\/assets\/googlelogo_color_272x92dp_\w{4,10}.jpeg/,
			size: { width: 544, height: 184, type: 'jpg' },
		},
	].forEach(({ title, id, regex, size }) => {
		it(title, () => {
			const image = $(id);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());

			verifyImage(image.attr('src').replace('/docs', ''), size);
		});
	});
});
