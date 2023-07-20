import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './test-utils.js';

let fixture;

describe('Image rotation', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/rotation/' });
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/rotation/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	describe('build', () => {
		let $;
		let html;

		before(async () => {
			await fixture.build();

			html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('Landscape images', () => {
			for (let i = 0; i < 9; i++) {
				const image = $(`#landscape-${i}`);
				const regex = new RegExp(`\^/_astro\/Landscape_${i}.\\w{8}_\\w{4,10}.jpg`);

				expect(image.attr('src')).to.match(regex);
				expect(image.attr('width')).to.equal('1800');
				expect(image.attr('height')).to.equal('1200');

				verifyImage(image.attr('src'), {
					width: 1800,
					height: 1200,
					type: 'jpg',
				});
			}
		});

		it('Portait images', () => {
			for (let i = 0; i < 9; i++) {
				const image = $(`#portrait-${i}`);
				const regex = new RegExp(`\^/_astro\/Portrait_${i}.\\w{8}_\\w{4,10}.jpg`);

				expect(image.attr('src')).to.match(regex);
				expect(image.attr('width')).to.equal('1200');
				expect(image.attr('height')).to.equal('1800');

				verifyImage(image.attr('src'), {
					width: 1200,
					height: 1800,
					type: 'jpg',
				});
			}
		});
	});
});
