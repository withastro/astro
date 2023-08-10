import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './test-utils.js';

describe('Images in MDX - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/with-mdx/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/with-mdx/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
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
			title: 'Public images',
			id: '#hero',
			regex: /^\/_astro\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
		},
		{
			title: 'Background color',
			id: '#bg-color',
			regex: /^\/_astro\/googlelogo_color_272x92dp_\w{4,10}.jpeg/,
			size: { width: 544, height: 184, type: 'jpg' },
		},
	].forEach(({ title, id, regex, size }) => {
		it(title, () => {
			const image = $(id);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());

			verifyImage(image.attr('src'), size);
		});
	});
});
