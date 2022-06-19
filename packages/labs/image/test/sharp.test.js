import { expect } from 'chai';
import createSharp from '../dist/sharp.js';

describe('Sharp service', async () => {
	const sharp = createSharp({ routePattern: '/_image' });

	describe('toImageSrc', async () => {
		function verify(props, result) {
			const [route, search] = result.split('?');
			
			expect(route).to.equal('/_image');

			const params = new URLSearchParams(search);

			expect(params.get('href')).to.equal(props.src);

			if (props.quality) {
				expect(params.get('q')).to.equal(props.quality.toString());
			} else {
				expect(params.has('q')).to.be.false;
			}
		}

		[
			['only requires src', { src: '/assets/logo.png' }],
			['quality', { src: '/assets/hero.png', quality: 80 }],
			['format', { src: '/assets/logo.png', format: 'jpeg' }],
			['width', { src: '/assets/hero/bg.png', format: 'png' }],
			['height', { src: '/assets/logo.jpg', height: 414 }],
			['width & height', { src: '/assets/hero.png', height: 400, width: 200 }],
			['aspect ratio string', { src: '/assets/hero.jpeg', aspectRatio: '16:9' }],
			['aspect ratio float', { src: '/assets/hero.jpeg', aspectRatio: 1.7 }]
		].forEach(([description, props]) => {
			it(description, async () => {
				const result = await sharp.toImageSrc(props);

				const [route, search] = result.split('?');
				
				expect(route).to.equal('/_image');

				const params = new URLSearchParams(search);

				function verifyProp(expected, searchParam) {
					if (expected) {
						expect(params.get(searchParam)).to.equal(expected.toString());
					} else {
						expect(params.has(search)).to.be.false;
					}
				}

				verifyProp(props.src, 'href');
				verifyProp(props.quality, 'q');
				verifyProp(props.format, 'f');
				verifyProp(props.width, 'w');
				verifyProp(props.height, 'h');
				verifyProp(props.ratio, 'ratio');
			});
		});
	});
});
