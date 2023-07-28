import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Unified class', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-unified-class/' });
		await fixture.build();
	});

	it('Passes class as expected to child element into class', async () => {
		const html = await fixture.readFile('/class-class/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class as expected to child element into class list', async () => {
		const html = await fixture.readFile('/class-classlist/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class as expected to child element into spread', async () => {
		const html = await fixture.readFile('/class-spread/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class list as expected to child element into class', async () => {
		const html = await fixture.readFile('/classlist-class/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class list as expected to child element into class list', async () => {
		const html = await fixture.readFile('/classlist-classlist/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class list as expected to child element into spread', async () => {
		const html = await fixture.readFile('/classlist-spread/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('class').split(' ')).to.have.lengthOf(3);
	});

	it('Passes class list attributes as expected to elements', async () => {
		const html = await fixture.readFile('/element/index.html');
		const $ = cheerio.load(html);

		expect($('[class="test control"]')).to.have.lengthOf(1);
		expect($('[class="test expression"]')).to.have.lengthOf(1);
		expect($('[class="test true"]')).to.have.lengthOf(1);
		expect($('[class="test truthy"]')).to.have.lengthOf(1);
		expect($('[class="test set"]')).to.have.lengthOf(1);
		expect($('[class="hello goodbye world friend"]')).to.have.lengthOf(1);
		expect($('[class="foo baz"]')).to.have.lengthOf(1);
		expect($('span:not([class])')).to.have.lengthOf(1);

		expect($('.false, .noshow1, .noshow2, .noshow3, .noshow4')).to.have.lengthOf(0);
	});

	it('Passes class list attributes as expected to components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		console.log(html);

		expect($('[class="test control"]')).to.have.lengthOf(1);
		expect($('[class="test expression"]')).to.have.lengthOf(1);
		expect($('[class="test true"]')).to.have.lengthOf(1);
		expect($('[class="test truthy"]')).to.have.lengthOf(1);
		expect($('[class="test set"]')).to.have.lengthOf(1);
		expect($('[class="hello goodbye world friend"]')).to.have.lengthOf(1);
		expect($('[class="foo baz"]')).to.have.lengthOf(1);
		expect($('div:not([class])')).to.have.lengthOf(1);
	});
});
