import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Attributes', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-attrs/' });
		await fixture.build();
	});

	it('Passes attributes to elements as expected', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const attrs = {
			'false-str': 'false',
			'true-str': 'true',
			false: undefined,
			true: 'true',
			empty: '',
			null: undefined,
			undefined: undefined,
		};

		for (const [k, v] of Object.entries(attrs)) {
			const attr = $(`#${k}`).attr('attr');
			expect(attr).to.equal(v);
		}
	});

	it('Passes boolean attributes to components as expected', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('#true').attr('attr')).to.equal('attr-true');
		expect($('#true').attr('type')).to.equal('boolean');
		expect($('#false').attr('attr')).to.equal('attr-false');
		expect($('#false').attr('type')).to.equal('boolean');
	});

	it('Passes namespaced attributes as expected', async () => {
		const html = await fixture.readFile('/namespaced/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('xmlns:happy')).to.equal('https://example.com/schemas/happy');
		expect($('img').attr('happy:smile')).to.equal('sweet');
	});

	it('Passes namespaced attributes to components as expected', async () => {
		const html = await fixture.readFile('/namespaced-component/index.html');
		const $ = cheerio.load(html);

		expect($('span').attr('on:click')).to.deep.equal('(event) => console.log(event)');
	});
});
