import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Object style', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-object-style/' });
		await fixture.build();
	});

	it('Passes style attributes as expected to elements', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('[style="background-color:green"]')).to.have.lengthOf(1);
		expect($('[style="background-color:red"]')).to.have.lengthOf(1);
		expect($('[style="background-color:blue"]')).to.have.lengthOf(1);
		expect($(`[style='background-image:url("a")']`)).to.have.lengthOf(1);
	});

	it('Passes style attributes as expected to components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('[style="background-color:green"]')).to.have.lengthOf(1);
		expect($('[style="background-color:red"]')).to.have.lengthOf(1);
		expect($('[style="background-color:blue"]')).to.have.lengthOf(1);
		expect($(`[style='background-image:url("a")']`)).to.have.lengthOf(1);
	});
});
