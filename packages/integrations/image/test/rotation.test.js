import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
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

		describe('Landscape images', () => {
			it('includes <img> attributes', () => {
				for (let i = 0; i < 9; i++) {
					const image = $(`#landscape-${i}`);
	
					expect(image.attr('src')).to.equal(`/_image/assets/Landscape_${i}_1800x1200.jpg`);
					expect(image.attr('width')).to.equal('1800');
					expect(image.attr('height')).to.equal('1200');
				}
			});
	
			it('built the optimized image', () => {
				for (let i = 0; i < 9; i++) {
					verifyImage(`/_image/assets/Landscape_${i}_1800x1200.jpg`, { width: 1800, height: 1200, type: 'jpg' });
				}
			});
		});

		describe('Portait images', () => {
			it('includes <img> attributes', () => {
				for (let i = 0; i < 9; i++) {
					const image = $(`#portrait-${i}`);
	
					expect(image.attr('src')).to.equal(`/_image/assets/Portrait_${i}_1200x1800.jpg`);
					expect(image.attr('width')).to.equal('1200');
					expect(image.attr('height')).to.equal('1800');
				}
			});
	
			it('built the optimized image', () => {
				for (let i = 0; i < 9; i++) {
					verifyImage(`/_image/assets/Portrait_${i}_1200x1800.jpg`, { width: 1200, height: 1800, type: 'jpg' });
				}
			});
		});
	});
});
