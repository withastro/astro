import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const toAstroImage = (relpath) =>
	'/@astroimage' + pathToFileURL(join(__dirname, 'fixtures/basic-picture', relpath)).pathname;

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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
			alt: 'Social image',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { w: '768', h: '414', f: 'jpg' },
			contentType: 'image/jpeg',
			alt: 'spaces',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '768', h: '414' },
			contentType: 'image/png',
			alt: 'outside-src',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
				href: 'https://dummyimage.com/200x300',
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
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			for (const srcset of picture
				.children('source')
				.map((_, source) => source.attribs['srcset'])) {
				for (const pictureSrc of srcset.split(',')) {
					const pictureParams = pictureSrc.split('?')[1];

					const expected = new URLSearchParams(params).get('href');
					const actual = new URLSearchParams(pictureParams).get('href').replace(/\s+\d+w$/, '');
					expect(expected).to.equal(actual);
				}
			}

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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			contentType: 'image/jpeg',
			alt: 'Social image',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { w: '768', h: '414', f: 'jpg' },
			contentType: 'image/jpeg',
			alt: 'spaces',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '768', h: '414' },
			contentType: 'image/png',
			alt: 'outside-src',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
				href: 'https://dummyimage.com/200x300',
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
				href: '/docs/hero.jpg',
			},
			contentType: 'image/jpeg',
			alt: 'Hero image',
		},
	].forEach(({ title, id, url, query, alt, contentType }) => {
		it(title, async () => {
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

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
