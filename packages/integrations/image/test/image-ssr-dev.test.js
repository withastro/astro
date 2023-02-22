import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const toAstroImage = (relpath) =>
	'/@astroimage' + pathToFileURL(join(__dirname, 'fixtures/basic-image', relpath)).pathname;

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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
		},
		{
			title: 'Local image no transforms',
			id: '#no-transforms',
			url: toAstroImage('src/assets/social.jpg'),
			query: {},
			contentType: 'image/jpeg',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'webp', w: '768', h: '414' },
			contentType: 'image/webp',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '2024', h: '1012' },
			contentType: 'image/png',
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			url: toAstroImage('src/assets/logo.svg'),
			query: { f: 'svg', w: '192', h: '256' },
			contentType: 'image/svg+xml',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
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
			contentType: 'image/webp',
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
			contentType: 'image/jpeg',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: {
				f: 'webp',
				w: '768',
				h: '414',
				href: '/hero.jpg',
			},
			contentType: 'image/webp',
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
			contentType: 'image/jpeg',
		},
	].forEach(({ title, id, url, query, contentType }) => {
		it(title, async () => {
			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal(contentType);
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

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'webp', w: '768', h: '414' },
			contentType: 'image/webp',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '2024', h: '1012' },
			contentType: 'image/png',
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			url: toAstroImage('src/assets/logo.svg'),
			query: { f: 'svg', w: '192', h: '256' },
			contentType: 'image/svg+xml',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
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
			contentType: 'image/webp',
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
			contentType: 'image/jpeg',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: {
				f: 'webp',
				w: '768',
				h: '414',
				href: '/docs/hero.jpg',
			},
			contentType: 'image/webp',
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
			contentType: 'image/jpeg',
		},
	].forEach(({ title, id, url, query, contentType }) => {
		it(title, async () => {
			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			const res = await fixture.fetch(image.attr('src'));

			expect(res.status).to.equal(200);
			expect(res.headers.get('Content-Type')).to.equal(contentType);
		});
	});
});
