import { expect } from 'chai';
import createSharp from '../dist/sharp.js';

describe('Sharp service', async () => {
	const sharp = createSharp({ routePattern: '/_image' });

	describe('toImageSrc', async () => {
		const src = '/assets/hero/bg.png';

		[
			['only requires src', { src }],
			['quality', { src, quality: 80 }],
			['format', { src, format: 'jpeg' }],
			['width', { src, width: 1280 }],
			['height', { src, height: 414 }],
			['width & height', { src, height: 400, width: 200 }],
			['aspect ratio string', { src, aspectRatio: '16:9' }],
			['aspect ratio float', { src, aspectRatio: 1.7 }]
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

	describe('parseImageSrc', async () => {
		const src = '/assets/image.png';
		const href = encodeURIComponent(src);

		[
			['only requires src', `/_image?href=${href}`, { src }],
			['quality', `/_image?q=80&href=${href}`, { src, quality: 80 }],
			['format', `/_image?f=jpeg&href=${href}`, { src, format: 'jpeg' }],
			['width', `/_image?w=1280&href=${href}`, { src, width: 1280 }],
			['height', `/_image?h=414&href=${href}`, { src, height: 414 }],
			['width & height', `/_image?w=200&h=400&href=${href}`, { src, height: 400, width: 200 }],
			['aspect ratio string', `/_image?ratio=16:9&href=${href}`, { src, aspectRatio: '16:9' }],
			['aspect ratio float', `/_image?ratio=1.7&href=${href}`, { src, aspectRatio: 1.7 }]
		].forEach(([description, url, expected]) => {
			it(description, async () => {
				const props = sharp.parseImageSrc(url);
				expect(props).to.deep.equal(expected);
			});
		});
	});
});
