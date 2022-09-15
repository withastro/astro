import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

describe('Squoosh service', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/squoosh-service/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/squoosh-service/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/assets\/googlelogo_color_272x92dp_\w{4,10}.webp/,
			size: { width: 544, height: 184, type: 'webp' },
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/assets\/hero_\w{4,10}.webp/,
			size: { width: 768, height: 414, type: 'webp' },
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
