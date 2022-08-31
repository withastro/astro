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
			const hashes = [
				'/Landscape_0.080ebd7a_ZdTMkT.jpg',
				'/Landscape_1.c92e81c9_4Eikw.jpg',
				'/Landscape_2.f54c85e5_1iKxtI.jpg',
				'/Landscape_3.8e20af03_Z2sFwFL.jpg',
				'/Landscape_4.15f511b0_1dNJQt.jpg',
				'/Landscape_5.6d88c17f_ZtLntP.jpg',
				'/Landscape_6.1a88f6d8_Z1Pl4xy.jpg',
				'/Landscape_7.cb1008c2_Z1JYr40.jpg',
				'/Landscape_8.3d2837d2_1xTOBN.jpg',
			];

			it('includes <img> attributes', () => {
				for (let i = 0; i < 9; i++) {
					const image = $(`#landscape-${i}`);

					expect(image.attr('src')).to.equal(hashes[i]);
					expect(image.attr('width')).to.equal('1800');
					expect(image.attr('height')).to.equal('1200');
				}
			});

			it('built the optimized image', () => {
				for (let i = 0; i < 9; i++) {
					verifyImage(hashes[i], {
						width: 1800,
						height: 1200,
						type: 'jpg',
					});
				}
			});
		});

		describe('Portait images', () => {
			const hashes = [
				'/Portrait_0.e09ae908_5e5uz.jpg',
				'/Portrait_1.c7b4942e_1RJQep.jpg',
				'/Portrait_2.8e8be39f_T6sr4.jpg',
				'/Portrait_3.1dcc58b4_Z1uaoxA.jpg',
				'/Portrait_4.2f89d418_ZLQlNB.jpg',
				'/Portrait_5.b3b6cc6f_Z23Ek26.jpg',
				'/Portrait_6.94e06390_ak2Ek.jpg',
				'/Portrait_7.9ffdecfe_Z1S4klG.jpg',
				'/Portrait_8.9d01343d_2dak03.jpg',
			];

			it('includes <img> attributes', () => {
				for (let i = 0; i < 9; i++) {
					const image = $(`#portrait-${i}`);

					expect(image.attr('src')).to.equal(hashes[i]);
					expect(image.attr('width')).to.equal('1200');
					expect(image.attr('height')).to.equal('1800');
				}
			});

			it('built the optimized image', () => {
				for (let i = 0; i < 9; i++) {
					verifyImage(hashes[i], {
						width: 1200,
						height: 1800,
						type: 'jpg',
					});
				}
			});
		});
	});
});
