import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

describe("Static build - pageUrlFormat: 'file'", () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static-build-page-url-format/',
		});
		await fixture.build();
	});

	it('Builds pages in root', async () => {
		const html = await fixture.readFile('/one.html');
		expect(html).to.be.a('string');
	});

	it('Builds pages in subfolders', async () => {
		const html = await fixture.readFile('/sub/page.html');
		expect(html).to.be.a('string');
	});
});
