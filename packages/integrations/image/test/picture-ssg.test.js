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

			it('includes <img> attributes', () => {
				const image = $('#social-jpg img');

				expect(image.attr('src')).to.equal('/social.cece8c77_isw36.jpg');
				expect(image.attr('width')).to.equal('506');
				expect(image.attr('height')).to.equal('253');
				expect(image.attr('alt')).to.equal('Social image');
			});

			it('built the optimized image', () => {
				verifyImage('social.cece8c77_Z1qCkLW.avif', { width: 253, height: 127, type: 'avif' });
				verifyImage('social.cece8c77_ZHhvOb.webp', { width: 253, height: 127, type: 'webp' });
				verifyImage('social.cece8c77_ZwfMjf.jpg', { width: 253, height: 127, type: 'jpg' });
				verifyImage('social.cece8c77_6t5Xo.avif', { width: 506, height: 253, type: 'avif' });
				verifyImage('social.cece8c77_ONTVa.webp', { width: 506, height: 253, type: 'webp' });
				verifyImage('social.cece8c77_isw36.jpg', { width: 506, height: 253, type: 'jpg' });
			});
		});

		describe('Inline imports', () => {
			it('includes sources', () => {
				const sources = $('#inline source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes <img> attributes', () => {
				const image = $('#inline img');

				expect(image.attr('src')).to.equal('/social.cece8c77_isw36.jpg');
				expect(image.attr('width')).to.equal('506');
				expect(image.attr('height')).to.equal('253');
				expect(image.attr('alt')).to.equal('Inline social image');
			});

			it('built the optimized image', () => {
				verifyImage('social.cece8c77_Z1qCkLW.avif', { width: 253, height: 127, type: 'avif' });
				verifyImage('social.cece8c77_ZHhvOb.webp', { width: 253, height: 127, type: 'webp' });
				verifyImage('social.cece8c77_ZwfMjf.jpg', { width: 253, height: 127, type: 'jpg' });
				verifyImage('social.cece8c77_6t5Xo.avif', { width: 506, height: 253, type: 'avif' });
				verifyImage('social.cece8c77_ONTVa.webp', { width: 506, height: 253, type: 'webp' });
				verifyImage('social.cece8c77_isw36.jpg', { width: 506, height: 253, type: 'jpg' });
			});
		});

		describe('Remote images', () => {
			// Hard-coding in the test! This should never change since the hash is based
			// on the static `src` string
			const HASH = 'ZWW1pg';

			it('includes sources', () => {
				const sources = $('#google source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes <img> attributes', () => {
				const image = $('#google img');

				expect(image.attr('src')).to.equal(`/googlelogo_color_272x92dp_${HASH}.png`);
				expect(image.attr('width')).to.equal('544');
				expect(image.attr('height')).to.equal('184');
				expect(image.attr('alt')).to.equal('Google logo');
			});

			it('built the optimized image', () => {
				verifyImage(`googlelogo_color_272x92dp_1YsbPJ.avif`, {
					width: 272,
					height: 92,
					type: 'avif',
				});
				verifyImage(`googlelogo_color_272x92dp_1OJIxd.webp`, {
					width: 272,
					height: 92,
					type: 'webp',
				});
				verifyImage(`googlelogo_color_272x92dp_ZaELrV.png`, {
					width: 272,
					height: 92,
					type: 'png',
				});
				verifyImage(`googlelogo_color_272x92dp_I7OBe.avif`, {
					width: 544,
					height: 184,
					type: 'avif',
				});
				verifyImage(`googlelogo_color_272x92dp_ReA0T.webp`, {
					width: 544,
					height: 184,
					type: 'webp',
				});
				verifyImage(`googlelogo_color_272x92dp_ZWW1pg.png`, {
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

			it('includes <img> attributes', () => {
				const image = $('#social-jpg img');

				expect(image.attr('src')).to.equal('/social_Z25HdvF.jpg');
				expect(image.attr('alt')).to.equal('Social image');
			});
		});

		describe('Local images with inline imports', () => {
			it('includes sources', () => {
				const sources = $('#inline source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes <img> attributes', () => {
				const image = $('#inline img');

				expect(image.attr('src')).to.equal('/social_Z25HdvF.jpg');
				expect(image.attr('alt')).to.equal('Inline social image');
			});
		});

		describe('Remote images', () => {
			it('includes sources', () => {
				const sources = $('#google source');

				expect(sources.length).to.equal(3);

				// TODO: better coverage to verify source props
			});

			it('includes <img> attributes', () => {
				const image = $('#google img');

				expect(image.attr('src')).to.equal('/googlelogo_color_272x92dp_ZWW1pg.png');
				expect(image.attr('alt')).to.equal('Google logo');
			});
		});
	});
});
