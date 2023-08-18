import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Class List', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-class-list/' });
		await fixture.build();
	});

	it('Passes class:list attributes as expected to elements', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('[class="test control"]')).to.have.lengthOf(1, '[class="test control"]');
		expect($('[class="test expression"]')).to.have.lengthOf(1, '[class="test expression"]');
		expect($('[class="test true"]')).to.have.lengthOf(1, '[class="test true"]');
		expect($('[class="test truthy"]')).to.have.lengthOf(1, '[class="test truthy"]');
		expect($('[class="test set"]')).to.have.lengthOf(1, '[class="test set"]');
		expect($('[class="hello goodbye hello world hello friend"]')).to.have.lengthOf(1, '[class="hello goodbye hello world hello friend"]');
		expect($('[class="foo baz"]')).to.have.lengthOf(1, '[class="foo baz"]');
		expect($('span:not([class])')).to.have.lengthOf(1, 'span:not([class])');

		expect($('.false, .noshow1, .noshow2, .noshow3, .noshow4')).to.have.lengthOf(0);
	});

	it('Passes class:list attributes as expected to components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('[class="test control"]')).to.have.lengthOf(1, '[class="test control"]');
		expect($('[class="test expression"]')).to.have.lengthOf(1, '[class="test expression"]');
		expect($('[class="test true"]')).to.have.lengthOf(1, '[class="test true"]');
		expect($('[class="test truthy"]')).to.have.lengthOf(1, '[class="test truthy"]');
		expect($('[class="test set"]')).to.have.lengthOf(1, '[class="test set"]');
		expect($('[class="hello goodbye hello world hello friend"]')).to.have.lengthOf(1, '[class="hello goodbye hello world hello friend"]');
		expect($('[class="foo baz"]')).to.have.lengthOf(1, '[class="foo baz"]');
		expect($('span:not([class])')).to.have.lengthOf(1, 'span:not([class])');

		expect($('[class="test control"]').text()).to.equal('test control');
		expect($('[class="test expression"]').text()).to.equal('test expression');
		expect($('[class="test true"]').text()).to.equal('test true');
		expect($('[class="test truthy"]').text()).to.equal('test truthy');
		expect($('[class="test set"]').text()).to.equal('test set');
		expect($('[class="hello goodbye hello world hello friend"]').text()).to.equal('hello goodbye hello world hello friend');
		expect($('[class="foo baz"]').text()).to.equal('foo baz');
		expect($('span:not([class])').text()).to.equal('');
	});
});
