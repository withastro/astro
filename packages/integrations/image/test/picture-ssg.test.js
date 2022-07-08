import { expect } from 'chai';
import * as cheerio from 'cheerio';
import fs from 'fs';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

let fixture;

describe('SSG pictures', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/' });
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-picture/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);

		// image-size doesn't support AVIF files
		if (expected.type !== 'avif') {
			const result = sizeOf(dist);
			expect(result).to.deep.equal(expected);
		} else {
			expect(fs.statSync(dist)).not.to.be.undefined;
		}
	}

	describe('build', () => {
		let $;
		let html;

		before(async () => {
			await fixture.build();

			html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		describe('Local images', () => {
			it('includes sources', () => {
				const sources = $('#social-jpg source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#social-jpg img');

				expect(image.attr('src')).to.equal('/_image/assets/social_506x253.jpg');
				expect(image.attr('width')).to.equal('506');
				expect(image.attr('height')).to.equal('253');
			});

			it('built the optimized image', () => {
				verifyImage('_image/assets/social_253x127.avif', { width: 253, height: 127, type: 'avif' });
				verifyImage('_image/assets/social_253x127.webp', { width: 253, height: 127, type: 'webp' });
				verifyImage('_image/assets/social_253x127.jpg', { width: 253, height: 127, type: 'jpg' });
				verifyImage('_image/assets/social_506x253.avif', { width: 506, height: 253, type: 'avif' });
				verifyImage('_image/assets/social_506x253.webp', { width: 506, height: 253, type: 'webp' });
				verifyImage('_image/assets/social_506x253.jpg', { width: 506, height: 253, type: 'jpg' });
			});
		});

		describe('Inline imports', () => {
			it('includes sources', () => {
				const sources = $('#inline source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#inline img');

				expect(image.attr('src')).to.equal('/_image/assets/social_506x253.jpg');
				expect(image.attr('width')).to.equal('506');
				expect(image.attr('height')).to.equal('253');
			});

			it('built the optimized image', () => {
				verifyImage('_image/assets/social_253x127.avif', { width: 253, height: 127, type: 'avif' });
				verifyImage('_image/assets/social_253x127.webp', { width: 253, height: 127, type: 'webp' });
				verifyImage('_image/assets/social_253x127.jpg', { width: 253, height: 127, type: 'jpg' });
				verifyImage('_image/assets/social_506x253.avif', { width: 506, height: 253, type: 'avif' });
				verifyImage('_image/assets/social_506x253.webp', { width: 506, height: 253, type: 'webp' });
				verifyImage('_image/assets/social_506x253.jpg', { width: 506, height: 253, type: 'jpg' });
			});
		});

		describe('Remote images', () => {
			it('includes sources', () => {
				const sources = $('#google source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#google img');

				expect(image.attr('src')).to.equal('/_image/googlelogo_color_272x92dp_544x184.png');
				expect(image.attr('width')).to.equal('544');
				expect(image.attr('height')).to.equal('184');
			});

			it('built the optimized image', () => {
				verifyImage('_image/googlelogo_color_272x92dp_272x92.avif', {
					width: 272,
					height: 92,
					type: 'avif',
				});
				verifyImage('_image/googlelogo_color_272x92dp_272x92.webp', {
					width: 272,
					height: 92,
					type: 'webp',
				});
				verifyImage('_image/googlelogo_color_272x92dp_272x92.png', {
					width: 272,
					height: 92,
					type: 'png',
				});
				verifyImage('_image/googlelogo_color_272x92dp_544x184.avif', {
					width: 544,
					height: 184,
					type: 'avif',
				});
				verifyImage('_image/googlelogo_color_272x92dp_544x184.webp', {
					width: 544,
					height: 184,
					type: 'webp',
				});
				verifyImage('_image/googlelogo_color_272x92dp_544x184.png', {
					width: 544,
					height: 184,
					type: 'png',
				});
			});
		});
	});

	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			await devServer.stop();
		});

		describe('Local images', () => {
			it('includes sources', () => {
				const sources = $('#social-jpg source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#social-jpg img');

				const src = image.attr('src');
				const [route, params] = src.split('?');

				expect(route).to.equal('/_image');

				const searchParams = new URLSearchParams(params);

				expect(searchParams.get('f')).to.equal('jpg');
				expect(searchParams.get('w')).to.equal('506');
				expect(searchParams.get('h')).to.equal('253');
				// TODO: possible to avoid encoding the full image path?
				expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
			});

			it('returns the optimized image', async () => {
				const image = $('#social-jpg img');

				const res = await fixture.fetch(image.attr('src'));

				expect(res.status).to.equal(200);
				expect(res.headers.get('Content-Type')).to.equal('image/jpeg');

				// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
			});
		});

		describe('Local images with inline imports', () => {
			it('includes sources', () => {
				const sources = $('#inline source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#inline img');

				const src = image.attr('src');
				const [route, params] = src.split('?');

				expect(route).to.equal('/_image');

				const searchParams = new URLSearchParams(params);

				expect(searchParams.get('f')).to.equal('jpg');
				expect(searchParams.get('w')).to.equal('506');
				expect(searchParams.get('h')).to.equal('253');
				// TODO: possible to avoid encoding the full image path?
				expect(searchParams.get('href').endsWith('/assets/social.jpg')).to.equal(true);
			});

			it('returns the optimized image', async () => {
				const image = $('#inline img');

				const res = await fixture.fetch(image.attr('src'));

				expect(res.status).to.equal(200);
				expect(res.headers.get('Content-Type')).to.equal('image/jpeg');

				// TODO: verify image file? It looks like sizeOf doesn't support ArrayBuffers
			});
		});

		describe('Remote images', () => {
			it('includes sources', () => {
				const sources = $('#google source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes src, width, and height attributes', () => {
				const image = $('#google img');

				const src = image.attr('src');
				const [route, params] = src.split('?');

				expect(route).to.equal('/_image');

				const searchParams = new URLSearchParams(params);

				expect(searchParams.get('f')).to.equal('png');
				expect(searchParams.get('w')).to.equal('544');
				expect(searchParams.get('h')).to.equal('184');
				expect(searchParams.get('href')).to.equal(
					'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
				);
			});
		});
	});
});
