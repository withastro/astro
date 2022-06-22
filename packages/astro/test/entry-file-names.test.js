import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('vite.build.rollupOptions.entryFileNames', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/entry-file-names',
		});
		await fixture.build();
	});

	it('Renders correctly', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#hello')).to.have.a.lengthOf(1);
	});

	it('Outputs a client module that was specified by the config', async () => {
		const js = await fixture.readFile('/assets/js/Hello.js');
		expect(js).to.be.a('string');
		expect(js.length).to.be.greaterThan(0);
	});
});
