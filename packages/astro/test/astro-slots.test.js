import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-slots/' });
		await fixture.build();
	});

	it('Basic named slots work', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#a').text().trim()).to.equal('A');
		expect($('#b').text().trim()).to.equal('B');
		expect($('#c').text().trim()).to.equal('C');
		expect($('#default').text().trim()).to.equal('Default');
	});

	it('Dynamic named slots work', async () => {
		const html = await fixture.readFile('/dynamic/index.html');
		const $ = cheerio.load(html);

		expect($('#a').text().trim()).to.equal('A');
		expect($('#b').text().trim()).to.equal('B');
		expect($('#c').text().trim()).to.equal('C');
		expect($('#default').text().trim()).to.equal('Default');
	});

	it('Slots render fallback content by default', async () => {
		const html = await fixture.readFile('/fallback/index.html');
		const $ = cheerio.load(html);

		expect($('#default')).to.have.lengthOf(1);
	});

	it('Slots override fallback content', async () => {
		const html = await fixture.readFile('/fallback-override/index.html');
		const $ = cheerio.load(html);

		expect($('#override')).to.have.lengthOf(1);
	});

	it('Slots work with multiple elements', async () => {
		const html = await fixture.readFile('/multiple/index.html');
		const $ = cheerio.load(html);

		expect($('#a').text().trim()).to.equal('ABC');
	});

	it('Slots work on Components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		// test 1: #a renders
		expect($('#a')).to.have.lengthOf(1);

		// test 2: Slotted component into #a
		expect($('#a').children('astro-component')).to.have.lengthOf(1);

		// test 3: Slotted component into default slot
		expect($('#default').children('astro-component')).to.have.lengthOf(1);
	});

	it('Slots API work on Components', async () => {
		// IDs will exist whether the slots are filled or not
		{
			const html = await fixture.readFile('/slottedapi-default/index.html');
			const $ = cheerio.load(html);

			expect($('#a')).to.have.lengthOf(1);
			expect($('#b')).to.have.lengthOf(1);
			expect($('#c')).to.have.lengthOf(1);
			expect($('#default')).to.have.lengthOf(1);
		}

		// IDs will not exist because the slots are not filled
		{
			const html = await fixture.readFile('/slottedapi-empty/index.html');
			const $ = cheerio.load(html);

			expect($('#a')).to.have.lengthOf(0);
			expect($('#b')).to.have.lengthOf(0);
			expect($('#c')).to.have.lengthOf(0);
			expect($('#default')).to.have.lengthOf(0);
		}

		// IDs will exist because the slots are filled
		{
			const html = await fixture.readFile('/slottedapi-filled/index.html');
			const $ = cheerio.load(html);

			expect($('#a')).to.have.lengthOf(1);
			expect($('#b')).to.have.lengthOf(1);
			expect($('#c')).to.have.lengthOf(1);

			expect($('#default')).to.have.lengthOf(0); // the default slot is not filled
		}

		// Default ID will exist because the default slot is filled
		{
			const html = await fixture.readFile('/slottedapi-default-filled/index.html');
			const $ = cheerio.load(html);

			expect($('#a')).to.have.lengthOf(0);
			expect($('#b')).to.have.lengthOf(0);
			expect($('#c')).to.have.lengthOf(0);

			expect($('#default')).to.have.lengthOf(1); // the default slot is filled
		}
	});

	it('Slots.render() API', async () => {
		// Simple imperative slot render
		{
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render')).to.have.lengthOf(1);
			expect($('#render').text()).to.equal('render');
		}

		// Child function render without args
		{
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render-fn')).to.have.lengthOf(1);
			expect($('#render-fn').text()).to.equal('render-fn');
		}

		// Child function render with args
		{
			const html = await fixture.readFile('/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			expect($('#render-args')).to.have.lengthOf(1);
			expect($('#render-args').text()).to.equal('render-args');
		}
	});
});
