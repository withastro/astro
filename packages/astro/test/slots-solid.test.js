import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots: Solid', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/slots-solid/', renderers: ['@astrojs/renderer-solid'] });
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
