import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots: React', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/slots-react/' });
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

	it('Renders named slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#named').text().trim()).to.equal('Fallback / Named');
	});

	it('Converts dash-case slot to camelCase', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#dash-case').text().trim()).to.equal('Fallback / Dash Case');
	});

	describe('For MDX Pages', () => {
		it('Renders default slot', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerio.load(html);
			expect($('#content').text().trim()).to.equal('Hello world!');
		});

		it('Renders named slot', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerio.load(html);
			expect($('#named').text().trim()).to.equal('Fallback / Named');
		});

		it('Converts dash-case slot to camelCase', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerio.load(html);
			expect($('#dash-case').text().trim()).to.equal('Fallback / Dash Case');
		});
	});

	describe('Slots.render() API', async () => {
		it('Simple imperative slot render', async () => {
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render')).to.have.lengthOf(1);
			expect($('#render').text()).to.equal('render');
		});

		it('Child function render without args', async () => {
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render-fn')).to.have.lengthOf(1);
			expect($('#render-fn').text()).to.equal('render-fn');
		});

		it('Child function render with args', async () => {
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render-args')).to.have.lengthOf(1);
			expect($('#render-args span')).to.have.lengthOf(1);
			expect($('#render-args').text()).to.equal('render-args');
		});
	});
});
