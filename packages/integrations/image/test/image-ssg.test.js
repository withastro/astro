import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadFixture } from './test-utils.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const toAstroImage = (relpath) =>
	'/@astroimage' + pathToFileURL(join(__dirname, 'fixtures/basic-image', relpath)).pathname;

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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
		},
		{
			title: 'Local image no transforms',
			id: '#no-transforms',
			url: toAstroImage('src/assets/social.jpg'),
			query: {},
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'webp', w: '768', h: '414' },
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
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
		},
		{
			title: 'Local image no transforms',
			id: '#no-transforms',
			url: toAstroImage('src/assets/social.jpg'),
			query: {},
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'webp', w: '768', h: '414' },
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
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
		const dist = join(
			fileURLToPath(new URL('.', import.meta.url)),
			'fixtures/basic-image/dist',
			pathname
		);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			regex: /^\/_astro\/introducing astro.\w{8}_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.png/,
			size: { type: 'png', width: 2024, height: 1012 },
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			regex: /^\/_astro\/logo.\w{8}_\w{4,10}.svg/,
			size: { width: 192, height: 256, type: 'svg' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/_astro\/googlelogo_color_272x92dp_\w{4,10}.webp/,
			size: { width: 544, height: 184, type: 'webp' },
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/_astro\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/_astro\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Remote images',
			id: '#bg-color',
			regex: /^\/_astro\/googlelogo_color_272x92dp_\w{4,10}.jpeg/,
			size: { width: 544, height: 184, type: 'jpg' },
		},
	].forEach(({ title, id, regex, size }) => {
		it(title, async () => {
			const image = $(id);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());

			verifyImage(image.attr('src'), size);

			const url = new URL(
				'./fixtures/basic-image/node_modules/.astro/image' + image.attr('src'),
				import.meta.url
			);
			expect(await fs.stat(url), 'transformed image was cached').to.not.be.undefined;
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
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			regex: /^\/docs\/_astro\/introducing astro.\w{8}_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.png/,
			size: { type: 'png', width: 2024, height: 1012 },
		},
		{
			title: 'SVG image',
			id: '#logo-svg',
			regex: /^\/docs\/_astro\/logo.\w{8}_\w{4,10}.svg/,
			size: { width: 192, height: 256, type: 'svg' },
		},
		{
			title: 'Inline imports',
			id: '#inline',
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/docs\/_astro\/googlelogo_color_272x92dp_\w{4,10}.webp/,
			size: { width: 544, height: 184, type: 'webp' },
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/docs\/_astro\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/docs\/_astro\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Remote images',
			id: '#bg-color',
			regex: /^\/docs\/_astro\/googlelogo_color_272x92dp_\w{4,10}.jpeg/,
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
