import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots: Vue', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/slots-vue/' });
		await fixture.build();
	});

	it('Renders default slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#default-self-closing').text().trim()).to.equal('Fallback');
		expect($('#default-empty').text().trim()).to.equal('Fallback');
		expect($('#zero').text().trim()).to.equal('0');
		expect($('#false').text().trim()).to.equal('');
		expect($('#string').text().trim()).to.equal('');
		expect($('#content').text().trim()).to.equal('Hello world!');
	});
});
