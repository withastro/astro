import path from 'path';
import { expect } from 'chai';
import sharp from '../dist/loaders/sharp.js';

describe('Sharp service', () => {
	describe('serializeImageProps', () => {
		const src = '/assets/image.png';

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
				const { searchParams } = await sharp.serializeImageProps(props);

				function verifyProp(expected, search) {
					if (expected) {
						expect(searchParams.get(search)).to.equal(expected.toString());
					} else {
						expect(searchParams.has(search)).to.be.false;
					}
				}

				verifyProp(props.src, 'href');
				verifyProp(props.quality, 'q');
				verifyProp(props.format, 'f');
				verifyProp(props.width, 'w');
				verifyProp(props.height, 'h');
				verifyProp(props.aspectRatio, 'ratio');
			});
		});
	});

	describe('parseImageProps', async () => {
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
				const props = sharp.parseImageProps(url);

				expect(props).to.deep.equal(expected);
			});
		});
	});
});
